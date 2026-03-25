import * as XLSX from 'xlsx'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { SeniorityEntrySchema } from '~/utils/schemas/seniority-list'
import { useSeniorityStore } from '~/stores/seniority'
import { parseDate } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import {
  parseSpreadsheetData,
  autoDetectColumnMap,
  applyColumnMapAsync,
  isColumnMapComplete,
  type ColumnMap,
  type MappingOptions,
} from '~/utils/parse-spreadsheet'
import { getParser } from '~/utils/parsers/registry'
import { createLogger } from '~/utils/logger'

import { BATCH_SIZE } from '~/utils/parse-spreadsheet'

const log = createLogger('upload')

export type ProcessingPhase = 'idle' | 'reading' | 'parsing' | 'mapping' | 'validating'

const DEFAULT_COLUMN_MAP: ColumnMap = {
  seniority_number: -1,
  employee_number: -1,
  seat: -1,
  base: -1,
  fleet: -1,
  name: -1,
  hire_date: -1,
  retire_date: -1,
}

const DEFAULT_MAPPING_OPTIONS: MappingOptions = {
  nameMode: 'single',
  retireMode: 'direct',
}

/** Shared validation rules — Zod schema + duplicate/contiguity checks. */
function computeValidationErrors(entries: Partial<SeniorityEntry>[]): Map<number, string[]> {
  const errors = new Map<number, string[]>()

  entries.forEach((entry, i) => {
    const result = SeniorityEntrySchema.safeParse(entry)
    if (!result.success) {
      errors.set(i, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
      if (i === 0) {
        // Log first failing entry for debugging
        console.debug('[validation] first failing entry:', JSON.stringify(entry), result.error.issues)
      }
    }
  })

  const senNumToIndices = new Map<number, number[]>()
  entries.forEach((entry, i) => {
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

  return errors
}

export function useSeniorityUpload() {
  const fileName = ref<string>('')
  const rawHeaders = ref<string[]>([])
  const rawRows = ref<string[][]>([])

  const columnMap = ref<ColumnMap>({ ...DEFAULT_COLUMN_MAP })
  const mappingOptions = ref<MappingOptions>({ ...DEFAULT_MAPPING_OPTIONS })

  const entries = ref<Partial<SeniorityEntry>[]>([])
  const rowErrors = shallowRef<Map<number, string[]>>(new Map())

  const selectedParserId = ref<string | null>(null)
  const extractedEffectiveDate = ref<string | null>(null)
  const extractedTitle = ref<string | null>(null)
  const syntheticNote = ref<string | null>(null)
  const syntheticIndices = ref<Set<number>>(new Set())
  const autoDetectSucceeded = ref(false)

  const effectiveDate = ref<DateValue | null>(null)
  const title = ref('')
  const saving = ref(false)
  const saveError = ref<string | null>(null)

  // Multi-sheet XLSX support
  const sheetNames = ref<string[]>([])
  const selectedSheet = ref<string | null>(null)
  const workbookBuffer = ref<ArrayBuffer | null>(null)

  // Processing progress
  const processingPhase = ref<ProcessingPhase>('idle')
  const processingProgress = ref<{ current: number; total: number } | null>(null)

  async function parseFile(file: File) {
    const parserId = selectedParserId.value
    reset()
    selectedParserId.value = parserId
    fileName.value = file.name

    processingPhase.value = 'reading'
    processingProgress.value = null

    try {
      let buffer: ArrayBuffer
      try {
        buffer = await file.arrayBuffer()
      } catch (err) {
        const msg = 'Failed to read file. It may be corrupt or too large.'
        saveError.value = msg
        log.error(msg, { error: err instanceof Error ? err.message : String(err) })
        return
      }

      let workbook: XLSX.WorkBook
      try {
        workbook = XLSX.read(buffer, { type: 'array', raw: true })
      } catch (err) {
        const msg = 'Failed to parse file. Supported formats: .csv, .xlsx, .xls'
        saveError.value = msg
        log.error(msg, { error: err instanceof Error ? err.message : String(err) })
        return
      }

      if (workbook.SheetNames.length === 0) {
        saveError.value = 'This file contains no data sheets.'
        log.error('File has no sheets', { fileName: file.name })
        return
      }

      if (workbook.SheetNames.length > 1) {
        // Multi-sheet: pause for user selection
        sheetNames.value = [...workbook.SheetNames]
        workbookBuffer.value = buffer
        log.info('Multi-sheet file detected', { fileName: file.name, sheets: workbook.SheetNames })
        return
      }

      // Single sheet: process immediately
      processSheet(workbook, workbook.SheetNames[0]!)
    } finally {
      processingPhase.value = 'idle'
      processingProgress.value = null
    }
  }

  function selectSheet(name: string) {
    if (!workbookBuffer.value) return

    const workbook = XLSX.read(workbookBuffer.value, { type: 'array', raw: true })
    if (!workbook.SheetNames.includes(name)) {
      saveError.value = `Sheet '${name}' not found.`
      log.error('Sheet not found', { sheet: name })
      return
    }

    // Reset column mapping and validation state when switching sheets
    resetMappingState()
    selectedSheet.value = name
    processSheet(workbook, name)
  }

  function processSheet(workbook: XLSX.WorkBook, sheetName: string) {
    processingPhase.value = 'parsing'
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return

    const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (raw.length === 0) {
      saveError.value = 'This file contains no data rows.'
      log.warn('Empty sheet', { sheet: sheetName })
      return
    }

    const parser = getParser(selectedParserId.value ?? 'generic')
    let preResult
    try {
      preResult = parser.parse(raw)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      const msg = `Parser error: ${detail}. Check that your file matches the expected format.`
      saveError.value = msg
      log.error(msg, { parser: parser.id, error: detail })
      return
    }

    extractedEffectiveDate.value = preResult.metadata.effectiveDate
    extractedTitle.value = preResult.metadata.title
    syntheticNote.value = preResult.metadata.syntheticNote ?? null
    syntheticIndices.value = new Set(preResult.metadata.syntheticIndices ?? [])

    const { headers, rows } = parseSpreadsheetData(preResult.rows)

    if (headers.length === 0 || rows.length === 0) {
      saveError.value = 'Could not find a header row. Check that your file contains column headers.'
      log.warn('No header/rows after parsing', { sheet: sheetName })
      return
    }

    rawHeaders.value = headers
    rawRows.value = rows

    log.info('Sheet parsed', { sheet: sheetName, parser: parser.id, rows: rows.length, columns: headers.length })

    columnMap.value = autoDetectColumnMap(headers)
    autoDetectSucceeded.value = isColumnMapComplete(columnMap.value)
    log.debug('Column map result', { columnMap: columnMap.value, autoDetectSucceeded: autoDetectSucceeded.value, headers })
  }

  function resetMappingState() {
    rawHeaders.value = []
    rawRows.value = []
    columnMap.value = { ...DEFAULT_COLUMN_MAP }
    mappingOptions.value = { ...DEFAULT_MAPPING_OPTIONS }
    entries.value = []
    rowErrors.value = new Map()
    extractedEffectiveDate.value = null
    extractedTitle.value = null
    syntheticNote.value = null
    syntheticIndices.value = new Set()
    autoDetectSucceeded.value = false
    effectiveDate.value = null
    title.value = ''
    saveError.value = null
  }

  async function applyMapping() {
    try {
      processingPhase.value = 'mapping'
      processingProgress.value = { current: 0, total: rawRows.value.length }

      const mapped = await applyColumnMapAsync(
        rawRows.value,
        columnMap.value,
        mappingOptions.value,
        (current, total) => {
          processingProgress.value = { current, total }
        },
      )
      entries.value = mapped
      log.debug('Mapping complete', { entryCount: mapped.length, sampleEntry: mapped[0] })

      await validateAsync()
      log.debug('Validation complete', { errorCount: rowErrors.value.size, sampleErrors: [...rowErrors.value.entries()].slice(0, 3) })

      if (extractedEffectiveDate.value) {
        effectiveDate.value = parseDate(extractedEffectiveDate.value)
      } else {
        effectiveDate.value = parseDate(new Date().toISOString().split('T')[0]!)
      }

      if (extractedTitle.value && !title.value) {
        title.value = extractedTitle.value
      }
    } finally {
      processingPhase.value = 'idle'
      processingProgress.value = null
    }
  }

  async function validateAsync() {
    processingPhase.value = 'validating'
    const total = entries.value.length
    processingProgress.value = { current: 0, total }

    // Batch Zod validation with yield for UI responsiveness
    const schemaErrors = new Map<number, string[]>()
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const end = Math.min(i + BATCH_SIZE, total)
      for (let j = i; j < end; j++) {
        const entry = entries.value[j]!
        const result = SeniorityEntrySchema.safeParse(entry)
        if (!result.success) {
          schemaErrors.set(j, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
        }
      }
      processingProgress.value = { current: end, total }
      if (end < total) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }

    // Run full validation (duplicate/contiguity) then merge with schema errors
    const errors = computeValidationErrors(entries.value)
    for (const [idx, msgs] of schemaErrors) {
      const existing = errors.get(idx)
      if (existing) existing.unshift(...msgs)
      else errors.set(idx, msgs)
    }

    rowErrors.value = errors
    if (errors.size > 0) {
      log.warn('Validation errors found', { errorCount: errors.size, totalRows: total })
    }
  }

  function validate() {
    rowErrors.value = computeValidationErrors(entries.value)
    if (rowErrors.value.size > 0) {
      log.warn('Validation errors found', { errorCount: rowErrors.value.size, totalRows: entries.value.length })
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
    selectedParserId.value = null
    saving.value = false
    sheetNames.value = []
    selectedSheet.value = null
    workbookBuffer.value = null
    processingPhase.value = 'idle'
    processingProgress.value = null
    resetMappingState()
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
    syntheticNote,
    syntheticIndices,
    autoDetectSucceeded,
    effectiveDate,
    title,
    saving,
    saveError,
    errorCount,
    sheetNames,
    selectedSheet,
    processingPhase,
    processingProgress,
    parseFile,
    setFiles,
    selectSheet,
    applyMapping,
    validate,
    updateCell,
    deleteRow,
    deleteErrorRows,
    save,
    reset,
  }
}
