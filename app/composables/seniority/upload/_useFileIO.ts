import type { FilePhase, FilePhaseOptions } from './types'
import { autoDetectColumnMap, isColumnMapComplete } from '~/utils/parse-spreadsheet'
import { createLogger } from '~/utils/logger'
import { decodeWorkbook } from '~/utils/spreadsheet/decode-workbook'
import { getImportPlugin } from '~/utils/import-pipeline/plugins/registry'
import { prepareImport } from '~/utils/import-pipeline/prepare-import'
import type { DecodedWorkbook, ImportIssue, PreparedSheet } from '~/utils/import-pipeline/types'
import { useUserStore } from '~/stores/user'

const log = createLogger('upload:file')

export function _useFileIO(opts: FilePhaseOptions): FilePhase & { _reset: () => void } {
  const userStore = useUserStore()
  const fileName = ref('')
  const sheetNames = ref<string[]>([])
  const selectedSheet = ref<string | null>(null)
  const selectedHeaderRow = ref(0)
  const error = ref<string | null>(null)
  const headerRows = ref<string[][]>([])
  const sourceHeaders = ref<string[]>([])
  const preparationIssues = ref<ImportIssue[]>([])

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
  const excludedRowCount = computed(() => opts.preparedSheet.value?.rows.filter(row => row.included === false).length ?? 0)

  function applyPreparedSheet(preparedSheet: PreparedSheet, mappingSuggestions: Readonly<Partial<Record<keyof ColumnMap, string>>> = {}) {
    opts.preparedSheet.value = preparedSheet
    opts.rawHeaders.value = preparedSheet.columns.map(column => column.label)
    opts.rawRows.value = opts.preparedSheet.value.rows.filter(row => row.included !== false).map(row =>
      preparedSheet.columns.map(column => String(row.cells[column.id] ?? '')),
    )
    const detected = autoDetectColumnMap(opts.rawHeaders.value)
    opts.columnMap.value = Object.fromEntries(Object.entries(detected).map(([field, index]) => [
      field,
      mappingSuggestions[field as keyof ColumnMap]
        ? preparedSheet.columns.findIndex(column => column.id === mappingSuggestions[field as keyof ColumnMap])
        : index,
    ])) as ColumnMap
    opts.autoDetectSucceeded.value = isColumnMapComplete(opts.columnMap.value)
  }

  async function processImportSheet(workbook: DecodedWorkbook, sheetName: string, headerRowIndex?: number) {
    const sourceSheet = workbook.sheets.find(sheet => sheet.name === sheetName)
    if (!sourceSheet) return
    const plugin = getImportPlugin(opts.selectedParserId.value ?? '')
    if (!plugin) return
    headerRows.value = sourceSheet.rows.map(row => row.cells.map(cell => cell === null ? '' : String(cell)))
    sourceHeaders.value = sourceSheet.columns.map(column => column.label ?? column.id)
    selectedHeaderRow.value = headerRowIndex ?? plugin.suggestHeaderRow?.(sourceSheet) ?? 0
    const result = prepareImport({ plugin, sourceSheet, headerRowIndex: selectedHeaderRow.value })
    preparationIssues.value = [...result.issues]
    opts.extractedEffectiveDate.value = result.metadata.effectiveDate
    opts.extractedTitle.value = result.metadata.title
    applyPreparedSheet(result.preparedSheet, result.mappingSuggestions)
    const saved = (await userStore.getPreference('importMappings'))?.[plugin.id]
    if (saved) {
      opts.columnMap.value = Object.fromEntries(Object.entries(opts.columnMap.value).map(([field, index]) => {
        const savedId = saved.columns[field]
        const savedIndex = savedId ? result.preparedSheet.columns.findIndex(column => column.id === savedId) : -1
        return [field, savedIndex >= 0 ? savedIndex : index]
      })) as ColumnMap
      opts.autoDetectSucceeded.value = isColumnMapComplete(opts.columnMap.value)
      if (saved.mappingOptions) opts.mappingOptions.value = { ...opts.mappingOptions.value, ...saved.mappingOptions } as MappingOptions
    }
    if (result.issues.length > 0) {
      log.warn('Generic sheet preparation needs manual mapping', { issueKinds: result.issues.map(issue => issue.kind) })
    }
  }

  function includeExcludedRows() {
    if (!opts.preparedSheet.value) return
    applyPreparedSheet({
      ...opts.preparedSheet.value,
      rows: opts.preparedSheet.value.rows.map(row => ({ ...row, included: true })),
    })
  }

  async function setFile(file: File | null) {
    fileName.value = ''
    sheetNames.value = []
    selectedSheet.value = null
    decodedWorkbook = null
    headerRows.value = []
    sourceHeaders.value = []
    selectedHeaderRow.value = 0
    error.value = null
    preparationIssues.value = []
    opts.onSheetChange()

    if (!file) return

    fileName.value = file.name
    opts.progress.enter('reading')

    try {
      if (getImportPlugin(opts.selectedParserId.value ?? '')) {
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
          await processImportSheet(decoded.workbook, onlySheet)
        }
        return
      }

    } finally {
      opts.progress.idle()
    }
  }

  async function selectSheet(name: string) {
    if (!decodedWorkbook || !decodedWorkbook.sheetNames.includes(name)) return
    opts.onSheetChange()
    selectedSheet.value = name
    await processImportSheet(decodedWorkbook, name)
  }

  function selectHeaderRow(index: number) {
    const plugin = getImportPlugin(opts.selectedParserId.value ?? '')
    if (!plugin || !decodedWorkbook || !selectedSheet.value) return
    const sourceSheet = decodedWorkbook.sheets.find(sheet => sheet.name === selectedSheet.value)
    if (!sourceSheet || index < 0 || index >= sourceSheet.rows.length) return
    opts.onSheetChange()
    selectedHeaderRow.value = index
    void processImportSheet(decodedWorkbook, selectedSheet.value, index)
  }

  async function reprepare() {
    if (!decodedWorkbook || !selectedSheet.value || !opts.selectedParserId.value) return
    opts.onSheetChange()
    await processImportSheet(decodedWorkbook, selectedSheet.value)
  }

  function reset() {
    fileName.value = ''
    sheetNames.value = []
    selectedSheet.value = null
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
    sourceHeaders: readonly(sourceHeaders),
    needsSheetSelection,
    hasData,
    autoDetected,
    excludedRowCount,
    preparationIssues: readonly(preparationIssues),
    error: readonly(error),
    setFile,
    selectSheet,
    selectHeaderRow,
    reprepare,
    includeExcludedRows,
    _reset: reset,
  } as FilePhase & { _reset: () => void }
}
