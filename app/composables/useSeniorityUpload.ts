import * as XLSX from 'xlsx'
import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import { SeniorityEntrySchema } from '#shared/schemas/seniority-list'
import { parseDate } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import {
  parseSpreadsheetData,
  autoDetectColumnMap,
  applyColumnMap,
  type ColumnMap,
  type MappingOptions,
} from '~/utils/parse-spreadsheet'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('upload')

export function useSeniorityUpload() {
  // Step 1: Raw file data
  const fileName = ref<string>('')
  const rawHeaders = ref<string[]>([])
  const rawRows = ref<string[][]>([])

  // Step 2: Column mapping
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

  // Step 3: Validated entries
  const entries = ref<Partial<SeniorityEntry>[]>([])
  const rowErrors = shallowRef<Map<number, string[]>>(new Map())

  // Step 4: Upload metadata
  const effectiveDate = ref<DateValue | null>(null)
  const title = ref('')
  const saving = ref(false)
  const saveError = ref<string | null>(null)

  /** Parse a file (CSV or XLSX) into raw headers + rows. */
  async function parseFile(file: File) {
    reset()
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', raw: true })
    const sheetName = workbook.SheetNames[0]
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
    if (!sheet) return
    const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    const { headers, rows } = parseSpreadsheetData(raw)
    rawHeaders.value = headers
    rawRows.value = rows
    fileName.value = file.name

    log.info('File parsed', { fileName: file.name, rows: rows.length, columns: headers.length })

    // Auto-detect column mapping
    columnMap.value = autoDetectColumnMap(headers)
  }

  /** Apply column mapping and validate all rows. */
  function applyMapping() {
    const mapped = applyColumnMap(rawRows.value, columnMap.value, mappingOptions.value)
    entries.value = mapped
    validate()

    // Default effective date to today
    effectiveDate.value = parseDate(new Date().toISOString().split('T')[0]!)
  }

  /** Run Zod validation on each entry row, plus contiguous seniority number checks. */
  function validate() {
    const errors = new Map<number, string[]>()
    entries.value.forEach((entry, i) => {
      const result = SeniorityEntrySchema.safeParse(entry)
      if (!result.success) {
        errors.set(i, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
      }
    })

    // Check for duplicate and non-contiguous seniority numbers
    const senNumToIndices = new Map<number, number[]>()
    entries.value.forEach((entry, i) => {
      const num = entry.seniority_number
      if (typeof num === 'number' && Number.isInteger(num) && num > 0) {
        const indices = senNumToIndices.get(num) ?? []
        indices.push(i)
        senNumToIndices.set(num, indices)
      }
    })

    // Flag duplicates
    for (const [num, indices] of senNumToIndices) {
      if (indices.length > 1) {
        for (const i of indices) {
          const existing = errors.get(i) ?? []
          existing.push(`seniority_number: Duplicate seniority number ${num}`)
          errors.set(i, existing)
        }
      }
    }

    // Check for gaps in the sequence 1..N
    const allNums = Array.from(senNumToIndices.keys()).sort((a, b) => a - b)
    if (allNums.length > 0) {
      const expected = allNums.length
      const max = allNums[allNums.length - 1]!
      if (max !== expected || allNums[0] !== 1) {
        // Find which numbers are out of place — flag entries whose seniority_number
        // is outside the expected 1..N range or creates a gap
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

  /** Update a single cell and re-validate that row. */
  function updateCell(rowIndex: number, field: keyof SeniorityEntry, value: string | number) {
    const entry = entries.value[rowIndex]
    if (!entry) return
    ;(entry as Record<string, unknown>)[field] = value
    // Re-validate the single row
    const result = SeniorityEntrySchema.safeParse(entry)
    if (result.success) {
      rowErrors.value.delete(rowIndex)
    } else {
      rowErrors.value.set(rowIndex, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
    }
    triggerRef(rowErrors)
  }

  /** Delete a row. */
  function deleteRow(rowIndex: number) {
    entries.value.splice(rowIndex, 1)
    // Rebuild error map with shifted indices
    const newErrors = new Map<number, string[]>()
    rowErrors.value.forEach((errs, idx) => {
      if (idx < rowIndex) newErrors.set(idx, errs)
      else if (idx > rowIndex) newErrors.set(idx - 1, errs)
    })
    rowErrors.value = newErrors
  }

  const errorCount = computed(() => rowErrors.value.size)

  async function setFiles(files: File[] | null | undefined) {
    if (!files || files.length === 0) {
      reset()
      return
    }
    await parseFile(files[0]!)
  }

  /** Save the seniority list to the server. Returns the entry count on success, or throws. */
  async function save(): Promise<number> {
    saving.value = true
    saveError.value = null
    log.info('Upload started', { entryCount: entries.value.length, effectiveDate: effectiveDate.value?.toString() })
    try {
      const effectiveDateValue = effectiveDate.value ? effectiveDate.value.toString() : ''
      const result = await $fetch('/api/seniority-lists', {
        method: 'POST',
        body: {
          effective_date: effectiveDateValue,
          entries: entries.value,
          ...(title.value && { title: title.value }),
        },
      })
      log.info('Upload succeeded', { count: result.count })
      return result.count ?? 0
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      log.error('Upload failed', { error: message })
      saveError.value = message
      throw err
    } finally {
      saving.value = false
    }
  }

  /** Reset all state. */
  function reset() {
    fileName.value = ''
    rawHeaders.value = []
    rawRows.value = []
    columnMap.value = { seniority_number: -1, employee_number: -1, seat: -1, base: -1, fleet: -1, name: -1, hire_date: -1, retire_date: -1 }
    mappingOptions.value = { nameMode: 'single', retireMode: 'direct' }
    entries.value = []
    rowErrors.value = new Map()
    effectiveDate.value = null
    title.value = ''
    saving.value = false
    saveError.value = null
  }

  return {
    // State
    fileName,
    rawHeaders,
    rawRows,
    columnMap,
    mappingOptions,
    entries,
    rowErrors,
    effectiveDate,
    title,
    saving,
    saveError,
    // Computed
    errorCount,
    // Actions
    parseFile,
    setFiles,
    applyMapping,
    validate,
    updateCell,
    deleteRow,
    save,
    reset,
  }
}
