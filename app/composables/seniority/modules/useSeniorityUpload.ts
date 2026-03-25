import * as XLSX from 'xlsx'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { SeniorityEntrySchema } from '~/utils/schemas/seniority-list'
import { useSeniorityStore } from '~/stores/seniority'
import { parseDate } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import {
  parseSpreadsheetData,
  autoDetectColumnMap,
  applyColumnMap,
  isColumnMapComplete,
  type ColumnMap,
  type MappingOptions,
} from '~/utils/parse-spreadsheet'
import { getParser } from '~/utils/parsers/registry'
import { createLogger } from '~/utils/logger'

const log = createLogger('upload')

export function useSeniorityUpload() {
  const fileName = ref<string>('')
  const rawHeaders = ref<string[]>([])
  const rawRows = ref<string[][]>([])

  const columnMap = ref<ColumnMap>({
    seniority_number: -1,
    employee_number: -1,
    seat: -1,
    base: -1,
    fleet: -1,
    name: -1,
    hire_date: -1,
    retire_date: -1,
  })
  const mappingOptions = ref<MappingOptions>({
    nameMode: 'single',
    retireMode: 'direct',
  })

  const entries = ref<Partial<SeniorityEntry>[]>([])
  const rowErrors = shallowRef<Map<number, string[]>>(new Map())

  const selectedParserId = ref<string | null>(null)
  const extractedEffectiveDate = ref<string | null>(null)
  const extractedTitle = ref<string | null>(null)
  const autoDetectSucceeded = ref(false)

  const effectiveDate = ref<DateValue | null>(null)
  const title = ref('')
  const saving = ref(false)
  const saveError = ref<string | null>(null)

  async function parseFile(file: File) {
    const parserId = selectedParserId.value
    reset()
    selectedParserId.value = parserId
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', raw: true })
    const sheetName = workbook.SheetNames[0]
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
    if (!sheet) return
    const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    const parser = getParser(selectedParserId.value ?? 'generic')
    const preResult = parser.parse(raw)
    extractedEffectiveDate.value = preResult.metadata.effectiveDate
    extractedTitle.value = preResult.metadata.title

    const { headers, rows } = parseSpreadsheetData(preResult.rows)
    rawHeaders.value = headers
    rawRows.value = rows
    fileName.value = file.name

    log.info('File parsed', { fileName: file.name, parser: parser.id, rows: rows.length, columns: headers.length })

    columnMap.value = autoDetectColumnMap(headers)
    autoDetectSucceeded.value = isColumnMapComplete(columnMap.value)
  }

  function applyMapping() {
    const mapped = applyColumnMap(rawRows.value, columnMap.value, mappingOptions.value)
    entries.value = mapped
    validate()

    if (extractedEffectiveDate.value) {
      effectiveDate.value = parseDate(extractedEffectiveDate.value)
    } else {
      effectiveDate.value = parseDate(new Date().toISOString().split('T')[0]!)
    }

    if (extractedTitle.value && !title.value) {
      title.value = extractedTitle.value
    }
  }

  function validate() {
    const errors = new Map<number, string[]>()
    entries.value.forEach((entry, i) => {
      const result = SeniorityEntrySchema.safeParse(entry)
      if (!result.success) {
        errors.set(i, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
      }
    })

    const senNumToIndices = new Map<number, number[]>()
    entries.value.forEach((entry, i) => {
      const num = entry.seniority_number
      if (typeof num === 'number' && Number.isInteger(num) && num > 0) {
        const indices = senNumToIndices.get(num) ?? []
        indices.push(i)
        senNumToIndices.set(num, indices)
      }
    })

    for (const [num, indices] of senNumToIndices) {
      if (indices.length > 1) {
        for (const i of indices) {
          const existing = errors.get(i) ?? []
          existing.push(`seniority_number: Duplicate seniority number ${num}`)
          errors.set(i, existing)
        }
      }
    }

    const allNums = Array.from(senNumToIndices.keys()).sort((a, b) => a - b)
    if (allNums.length > 0) {
      const expected = allNums.length
      const max = allNums[allNums.length - 1]!
      if (max !== expected || allNums[0] !== 1) {
        const expectedSet = new Set(Array.from({ length: expected }, (_, i) => i + 1))
        for (const [num, indices] of senNumToIndices) {
          if (!expectedSet.has(num)) {
            for (const i of indices) {
              const existing = errors.get(i) ?? []
              existing.push(`seniority_number: Non-contiguous sequence — expected 1..${expected}, found ${num}`)
              errors.set(i, existing)
            }
          }
        }
      }
    }

    rowErrors.value = errors
    if (errors.size > 0) {
      log.warn('Validation errors found', { errorCount: errors.size, totalRows: entries.value.length })
    }
  }

  function updateCell(rowIndex: number, field: keyof SeniorityEntry, value: string | number) {
    const entry = entries.value[rowIndex]
    if (!entry) return
    ;(entry as Record<string, unknown>)[field] = value
    const result = SeniorityEntrySchema.safeParse(entry)
    if (result.success) {
      rowErrors.value.delete(rowIndex)
    } else {
      rowErrors.value.set(rowIndex, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
    }
    triggerRef(rowErrors)
  }

  function deleteRow(rowIndex: number) {
    entries.value.splice(rowIndex, 1)
    const newErrors = new Map<number, string[]>()
    rowErrors.value.forEach((errs, idx) => {
      if (idx < rowIndex) newErrors.set(idx, errs)
      else if (idx > rowIndex) newErrors.set(idx - 1, errs)
    })
    rowErrors.value = newErrors
  }

  function deleteErrorRows(): number {
    const errorIndices = new Set(rowErrors.value.keys())
    if (errorIndices.size === 0) return 0
    const count = errorIndices.size
    entries.value = entries.value.filter((_, i) => !errorIndices.has(i))
    rowErrors.value = new Map()
    validate()
    return count
  }

  const errorCount = computed(() => rowErrors.value.size)

  async function setFiles(files: File[] | null | undefined) {
    if (!files || files.length === 0) {
      reset()
      return
    }
    await parseFile(files[0]!)
  }

  async function save(): Promise<number> {
    saving.value = true
    saveError.value = null
    log.info('Upload started', { entryCount: entries.value.length, effectiveDate: effectiveDate.value?.toString() })
    try {
      const store = useSeniorityStore()
      const localEntries = (entries.value as SeniorityEntry[]).map(e => ({
        seniorityNumber: e.seniority_number,
        employeeNumber: e.employee_number,
        name: e.name ?? null,
        seat: e.seat,
        base: e.base,
        fleet: e.fleet,
        hireDate: e.hire_date,
        retireDate: e.retire_date,
      }))

      await store.addList(
        { title: title.value || null, effectiveDate: effectiveDate.value ? effectiveDate.value.toString() : '' },
        localEntries,
      )

      log.info('Upload succeeded', { count: localEntries.length })
      return localEntries.length
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      log.error('Upload failed', { error: message })
      saveError.value = message
      throw err
    } finally {
      saving.value = false
    }
  }

  function reset() {
    fileName.value = ''
    rawHeaders.value = []
    rawRows.value = []
    columnMap.value = { seniority_number: -1, employee_number: -1, seat: -1, base: -1, fleet: -1, name: -1, hire_date: -1, retire_date: -1 }
    mappingOptions.value = { nameMode: 'single', retireMode: 'direct' }
    entries.value = []
    rowErrors.value = new Map()
    selectedParserId.value = null
    extractedEffectiveDate.value = null
    extractedTitle.value = null
    autoDetectSucceeded.value = false
    effectiveDate.value = null
    title.value = ''
    saving.value = false
    saveError.value = null
  }

  return {
    fileName,
    rawHeaders,
    rawRows,
    columnMap,
    mappingOptions,
    entries,
    rowErrors,
    selectedParserId,
    extractedEffectiveDate,
    extractedTitle,
    autoDetectSucceeded,
    effectiveDate,
    title,
    saving,
    saveError,
    errorCount,
    parseFile,
    setFiles,
    applyMapping,
    validate,
    updateCell,
    deleteRow,
    deleteErrorRows,
    save,
    reset,
  }
}
