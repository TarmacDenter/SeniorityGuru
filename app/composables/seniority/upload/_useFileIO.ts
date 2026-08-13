import * as XLSX from 'xlsx'
import type { FilePhase, FilePhaseOptions } from './types'
import { parseSpreadsheetData, autoDetectColumnMap, isColumnMapComplete } from '~/utils/parse-spreadsheet'
import { getParser } from '~/utils/parsers/registry'
import { createLogger } from '~/utils/logger'
import { decodeWorkbook } from '~/utils/import-pipeline/decode-workbook'
import { genericImportPlugin } from '~/utils/import-pipeline/plugins/generic'
import { prepareImport } from '~/utils/import-pipeline/prepare-import'
import type { DecodedWorkbook, PreparedSheet } from '~/utils/import-pipeline/types'

const log = createLogger('upload:file')

export function _useFileIO(opts: FilePhaseOptions): FilePhase & { _reset: () => void } {
  const fileName = ref('')
  const sheetNames = ref<string[]>([])
  const selectedSheet = ref<string | null>(null)
  const selectedHeaderRow = ref(0)
  const error = ref<string | null>(null)
  const headerRows = ref<string[][]>([])

  let workbookBuffer: ArrayBuffer | null = null
  let decodedWorkbook: DecodedWorkbook | null = null

  const needsSheetSelection = computed(
    () => sheetNames.value.length > 1 && opts.rawRows.value.length === 0,
  )

  const hasData = computed(
    () => opts.rawRows.value.length > 0 && !needsSheetSelection.value,
  )

  const autoDetected = computed(
    () => opts.autoDetectSucceeded.value,
  )

  function processSheet(workbook: XLSX.WorkBook, sheetName: string) {
    opts.progress.enter('parsing')
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return

    const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (raw.length === 0) {
      error.value = 'This file contains no data rows.'
      log.warn('Empty sheet', { sheet: sheetName })
      return
    }

    const parser = getParser(opts.selectedParserId.value ?? 'generic')
    let preResult
    try {
      preResult = parser.parse(raw)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      error.value = `Parser error: ${detail}. Check that your file matches the expected format.`
      log.error('Parser failed', { parser: parser.id, error: detail })
      return
    }

    opts.extractedEffectiveDate.value = preResult.metadata.effectiveDate
    opts.extractedTitle.value = preResult.metadata.title
    opts.syntheticNote.value = preResult.metadata.syntheticNote ?? null
    opts.syntheticIndices.value = new Set(preResult.metadata.syntheticIndices ?? [])

    const { headers, rows } = parseSpreadsheetData(preResult.rows)

    if (headers.length === 0 || rows.length === 0) {
      error.value = 'Could not find a header row. Check that your file contains column headers.'
      log.warn('No header/rows after parsing', { sheet: sheetName })
      return
    }

    opts.rawHeaders.value = headers
    opts.rawRows.value = rows

    log.info('Sheet parsed', {
      sheet: sheetName, parser: parser.id, rows: rows.length, columns: headers.length,
    })

    opts.columnMap.value = autoDetectColumnMap(headers)
    opts.autoDetectSucceeded.value = isColumnMapComplete(opts.columnMap.value)
    log.debug('Column map result', {
      columnMap: opts.columnMap.value,
      autoDetectSucceeded: opts.autoDetectSucceeded.value,
      headers,
    })
  }

  function applyPreparedSheet(preparedSheet: PreparedSheet) {
    opts.preparedSheet.value = preparedSheet
    opts.rawHeaders.value = preparedSheet.columns.map(column => column.label)
    opts.rawRows.value = opts.preparedSheet.value.rows.map(row =>
      preparedSheet.columns.map(column => String(row.cells[column.id] ?? '')),
    )
    opts.columnMap.value = autoDetectColumnMap(opts.rawHeaders.value)
    opts.autoDetectSucceeded.value = isColumnMapComplete(opts.columnMap.value)
  }

  function processGenericSheet(workbook: DecodedWorkbook, sheetName: string) {
    const sourceSheet = workbook.sheets.find(sheet => sheet.name === sheetName)
    if (!sourceSheet) return
    headerRows.value = sourceSheet.rows.map(row => row.cells.map(cell => cell === null ? '' : String(cell)))
    selectedHeaderRow.value = 0
    const result = prepareImport({ plugin: genericImportPlugin, sourceSheet, headerRowIndex: 0 })
    applyPreparedSheet(result.preparedSheet)
    if (result.issues.length > 0) {
      log.warn('Generic sheet preparation needs manual mapping', { issueKinds: result.issues.map(issue => issue.kind) })
    }
  }

  async function setFile(file: File | null) {
    fileName.value = ''
    sheetNames.value = []
    selectedSheet.value = null
    workbookBuffer = null
    decodedWorkbook = null
    headerRows.value = []
    selectedHeaderRow.value = 0
    error.value = null
    opts.onSheetChange()

    if (!file) return

    fileName.value = file.name
    opts.progress.enter('reading')

    try {
      if (opts.selectedParserId.value === 'generic') {
        const decoded = await decodeWorkbook(file)
        if (!decoded.ok) {
          error.value = decoded.error.message
          return
        }
        decodedWorkbook = decoded.workbook
        sheetNames.value = [...decoded.workbook.sheetNames]
        if (decoded.workbook.sheetNames.length === 1) {
          const onlySheet = decoded.workbook.sheetNames[0]!
          selectedSheet.value = onlySheet
          processGenericSheet(decoded.workbook, onlySheet)
        }
        return
      }

      let buffer: ArrayBuffer
      try {
        buffer = await file.arrayBuffer()
      } catch (err) {
        error.value = 'Failed to read file. It may be corrupt or too large.'
        log.error('File read failed', { error: err instanceof Error ? err.message : String(err) })
        return
      }

      let workbook: XLSX.WorkBook
      try {
        workbook = XLSX.read(buffer, { type: 'array', raw: true })
      } catch (err) {
        error.value = 'Failed to parse file. Supported formats: .csv, .xlsx, .xls'
        log.error('XLSX parse failed', { error: err instanceof Error ? err.message : String(err) })
        return
      }

      if (workbook.SheetNames.length === 0) {
        error.value = 'This file contains no data sheets.'
        log.error('File has no sheets', { fileName: file.name })
        return
      }

      if (workbook.SheetNames.length > 1) {
        sheetNames.value = [...workbook.SheetNames]
        workbookBuffer = buffer
        log.info('Multi-sheet file detected', { fileName: file.name, sheets: workbook.SheetNames })
        return
      }

      processSheet(workbook, workbook.SheetNames[0]!)
    } finally {
      opts.progress.idle()
    }
  }

  function selectSheet(name: string) {
    if (opts.selectedParserId.value === 'generic' && decodedWorkbook) {
      if (!decodedWorkbook.sheetNames.includes(name)) return
      opts.onSheetChange()
      selectedSheet.value = name
      processGenericSheet(decodedWorkbook, name)
      return
    }
    if (!workbookBuffer) return

    const workbook = XLSX.read(workbookBuffer, { type: 'array', raw: true })
    if (!workbook.SheetNames.includes(name)) {
      error.value = `Sheet '${name}' not found.`
      log.error('Sheet not found', { sheet: name })
      return
    }

    opts.onSheetChange()
    selectedSheet.value = name
    processSheet(workbook, name)
  }

  function selectHeaderRow(index: number) {
    if (opts.selectedParserId.value !== 'generic' || !decodedWorkbook || !selectedSheet.value) return
    const sourceSheet = decodedWorkbook.sheets.find(sheet => sheet.name === selectedSheet.value)
    if (!sourceSheet || index < 0 || index >= sourceSheet.rows.length) return
    opts.onSheetChange()
    selectedHeaderRow.value = index
    const result = prepareImport({ plugin: genericImportPlugin, sourceSheet, headerRowIndex: index })
    applyPreparedSheet(result.preparedSheet)
  }

  function reset() {
    fileName.value = ''
    sheetNames.value = []
    selectedSheet.value = null
    workbookBuffer = null
    decodedWorkbook = null
    headerRows.value = []
    selectedHeaderRow.value = 0
    error.value = null
  }

  return {
    fileName: readonly(fileName),
    sheetNames: readonly(sheetNames),
    selectedSheet: readonly(selectedSheet),
    selectedHeaderRow: readonly(selectedHeaderRow),
    headerRows: readonly(headerRows),
    needsSheetSelection,
    hasData,
    autoDetected,
    error: readonly(error),
    setFile,
    selectSheet,
    selectHeaderRow,
    _reset: reset,
  } as FilePhase & { _reset: () => void }
}
