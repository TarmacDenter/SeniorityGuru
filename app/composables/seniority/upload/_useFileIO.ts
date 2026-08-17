import type { FilePhase, UploadColumnMap, UploadSession } from './types'
import { autoDetectColumnMap } from '~/utils/parse-spreadsheet'
import { createLogger } from '~/utils/logger'
import { decodeWorkbook } from '~/utils/spreadsheet/decode-workbook'
import { getImportPlugin } from '~/utils/import-pipeline/plugins/registry'
import { prepareImport } from '~/utils/import-pipeline/prepare-import'
import type { DecodedWorkbook, ImportDiagnosticTrace, ImportField, ImportIssue, PreparedSheet } from '~/utils/import-pipeline/types'
import { hasRequiredColumnMappings } from '~/utils/import-pipeline/fields'
import { useUserStore } from '~/stores/user'
import { useImportAttemptsStore } from '~/stores/import-attempts'
import { nowInstant, serializeInstant } from '~/utils/temporal'

const log = createLogger('upload:file')
const HEADER_ROW_PREVIEW_LIMIT = 100

export function _useFileIO(opts: UploadSession): FilePhase & { _reset: () => void } {
  const userStore = useUserStore()
  const importAttemptsStore = useImportAttemptsStore()
  const fileName = ref('')
  const sheetNames = ref<string[]>([])
  const selectedSheet = ref<string | null>(null)
  const selectedHeaderRow = ref(0)
  const error = ref<string | null>(null)
  const headerRows = ref<string[][]>([])
  const sourceHeaders = ref<string[]>([])
  const preparationIssues = opts.preparationIssues ?? ref<ImportIssue[]>([])

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
  const hasRequiredMappings = (map: UploadColumnMap, pluginRequired: readonly ImportField[] = []) => hasRequiredColumnMappings(map, {
    retirementFromBirthDate: opts.mappingOptions.value.retireMode === 'dob',
    pluginRequired,
  })

  function mappedColumnId(field: keyof UploadColumnMap, detected: ReturnType<typeof autoDetectColumnMap>, preparedSheet: PreparedSheet, mappingSuggestions: Readonly<Partial<Record<ImportField, string>>>): string | null {
    return mappingSuggestions[field]
      ?? (detected[field] >= 0 ? preparedSheet.columns[detected[field]]?.id ?? null : null)
  }

  function applyPreparedSheet(
    preparedSheet: PreparedSheet,
    mappingSuggestions: Readonly<Partial<Record<ImportField, string>>> = {},
    pluginRequired: readonly ImportField[] = [],
  ) {
    opts.preparedSheet.value = preparedSheet
    opts.rawHeaders.value = preparedSheet.columns.map(column => column.label)
    opts.rawRows.value = opts.preparedSheet.value.rows.filter(row => row.included !== false).map(row =>
      preparedSheet.columns.map(column => String(row.cells[column.id] ?? '')),
    )
    const detected = autoDetectColumnMap(opts.rawHeaders.value)
    opts.columnMap.value = {
      seniority_number: mappedColumnId('seniority_number', detected, preparedSheet, mappingSuggestions),
      employee_number: mappedColumnId('employee_number', detected, preparedSheet, mappingSuggestions),
      name: mappedColumnId('name', detected, preparedSheet, mappingSuggestions),
      seat: mappedColumnId('seat', detected, preparedSheet, mappingSuggestions),
      base: mappedColumnId('base', detected, preparedSheet, mappingSuggestions),
      fleet: mappedColumnId('fleet', detected, preparedSheet, mappingSuggestions),
      hire_date: mappedColumnId('hire_date', detected, preparedSheet, mappingSuggestions),
      retire_date: mappedColumnId('retire_date', detected, preparedSheet, mappingSuggestions),
    }
    opts.autoDetectSucceeded.value = hasRequiredMappings(opts.columnMap.value, pluginRequired)
  }

  async function processImportSheet(workbook: DecodedWorkbook, sheetName: string, headerRowIndex?: number) {
    const sourceSheet = workbook.sheets.find(sheet => sheet.name === sheetName)
    if (!sourceSheet) return
    const plugin = getImportPlugin(opts.selectedUploadTypeId.value ?? '')
    if (!plugin) return
    headerRows.value = sourceSheet.rows
      .slice(0, HEADER_ROW_PREVIEW_LIMIT)
      .map(row => row.cells.map(cell => cell === null ? '' : String(cell)))
    sourceHeaders.value = sourceSheet.columns.map(column => column.label ?? column.id)
    selectedHeaderRow.value = headerRowIndex ?? plugin.suggestHeaderRow?.(sourceSheet) ?? 0
    const result = prepareImport({ plugin, sourceSheet, headerRowIndex: selectedHeaderRow.value })
    if (opts.importAttemptId?.value) {
      await importAttemptsStore.updateTrace(opts.importAttemptId.value, trace => ({
          ...trace,
          sourceSheet,
          preparation: { headerRowIndex: selectedHeaderRow.value, patch: result.patch, issues: result.issues, metadata: result.metadata, preparedSheet: result.preparedSheet },
          stage: 'prepared',
          updatedAt: serializeInstant(nowInstant()),
      }))
    }
    preparationIssues.value = [...result.issues]
    opts.extractedEffectiveDate.value = result.metadata.effectiveDate
    opts.extractedTitle.value = result.metadata.title
    applyPreparedSheet(result.preparedSheet, result.mappingSuggestions, plugin.requiredMappings)
    const saved = (await userStore.getPreference('importMappings'))?.[plugin.id]
    if (saved) {
      const useSavedColumn = (field: keyof UploadColumnMap) => {
        const savedId = saved.columns[field]
        return savedId && result.preparedSheet.columns.some(column => column.id === savedId)
          ? savedId
          : opts.columnMap.value[field]
      }
      opts.columnMap.value = {
        seniority_number: useSavedColumn('seniority_number'),
        employee_number: useSavedColumn('employee_number'),
        name: useSavedColumn('name'),
        seat: useSavedColumn('seat'),
        base: useSavedColumn('base'),
        fleet: useSavedColumn('fleet'),
        hire_date: useSavedColumn('hire_date'),
        retire_date: useSavedColumn('retire_date'),
      }
      opts.autoDetectSucceeded.value = hasRequiredMappings(opts.columnMap.value, plugin.requiredMappings)
      if (saved.mappingOptions) opts.mappingOptions.value = { ...opts.mappingOptions.value, ...saved.mappingOptions }
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
    const plugin = getImportPlugin(opts.selectedUploadTypeId.value ?? '')
    if (plugin && opts.importAttemptId) {
      const id = crypto.randomUUID()
      opts.importAttemptId.value = await importAttemptsStore.record({
        id,
        pluginId: plugin.id,
        outcome: 'review',
        data: {
          diagnosticSchemaVersion: 3,
          appBuildVersion: 'local',
          plugin: { id: plugin.id, label: plugin.label },
          file: { name: file.name },
          createdAt: serializeInstant(nowInstant()),
          stage: 'reading',
          outcome: 'review',
        } satisfies ImportDiagnosticTrace,
      })
    }
    opts.progress.enter('reading')

    try {
      if (plugin) {
        const decoded = await decodeWorkbook(file)
        if (!decoded.ok) {
          error.value = decoded.error.message
          if (opts.importAttemptId?.value) await importAttemptsStore.complete(opts.importAttemptId.value, { outcome: 'failed', error: decoded.error.message })
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
    const plugin = getImportPlugin(opts.selectedUploadTypeId.value ?? '')
    if (!plugin || !decodedWorkbook || !selectedSheet.value) return
    const sourceSheet = decodedWorkbook.sheets.find(sheet => sheet.name === selectedSheet.value)
    if (!sourceSheet || index < 0 || index >= sourceSheet.rows.length) return
    opts.onSheetChange()
    selectedHeaderRow.value = index
    void processImportSheet(decodedWorkbook, selectedSheet.value, index)
  }

  async function reprepare() {
    if (!decodedWorkbook || !selectedSheet.value || !opts.selectedUploadTypeId.value) return
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
