import * as XLSX from 'xlsx'
import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import { SeniorityEntrySchema, isoDateRegex } from '#shared/schemas/seniority-list'
import { parseDate } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import {
  parseSpreadsheetData,
  autoDetectColumnMap,
  applyColumnMap,
  type ColumnMap,
  type MappingOptions,
} from '~/utils/parse-spreadsheet'

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

    // Auto-detect column mapping
    columnMap.value = autoDetectColumnMap(headers)
  }

  /** Apply column mapping and validate all rows. */
  function applyMapping() {
    const mapped = applyColumnMap(rawRows.value, columnMap.value, mappingOptions.value)
    entries.value = mapped
    validate()

    // Default effective date to the most recent hire date
    const hireDates = mapped
      .map(e => e.hire_date)
      .filter((d): d is string => !!d && isoDateRegex.test(d))
    if (hireDates.length > 0) {
      hireDates.sort()
      effectiveDate.value = parseDate(hireDates[hireDates.length - 1]!)
    }
  }

  /** Run Zod validation on each entry row. */
  function validate() {
    const errors = new Map<number, string[]>()
    entries.value.forEach((entry, i) => {
      const result = SeniorityEntrySchema.safeParse(entry)
      if (!result.success) {
        errors.set(i, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
      }
    })
    rowErrors.value = errors
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
    try {
      const effectiveDateValue = effectiveDate.value ? effectiveDate.value.toString() : ''
      const result = await $fetch('/api/seniority-lists', {
        method: 'POST',
        body: {
          effective_date: effectiveDateValue,
          entries: entries.value,
        },
      })
      return result.count ?? 0
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
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
