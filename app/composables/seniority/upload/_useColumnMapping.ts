import type { MappingPhase, UploadColumnMap, UploadMappingOptions, UploadSession } from './types'
import { createLogger } from '~/utils/logger'
import { DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS } from './defaults'
import { processConfirmedMappings } from '~/utils/import-pipeline/process-confirmed-mappings'
import { getImportPlugin } from '~/utils/import-pipeline/plugins/registry'
import { useUserStore } from '~/stores/user'
import { useImportAttemptsStore } from '~/stores/import-attempts'
import type { ConfirmedMappings, ImportIssue } from '~/utils/import-pipeline/types'
import { hasRequiredImportMappings } from '~/utils/import-pipeline/fields'

function toConfirmedMappings(
  map: UploadColumnMap,
  options: UploadMappingOptions,
): ConfirmedMappings {
  const column = (columnId: string | null) => columnId ? { kind: 'column' as const, columnId } : undefined
  return {
    seniority_number: column(map.seniority_number),
    employee_number: column(map.employee_number),
    seat: column(map.seat),
    base: column(map.base),
    fleet: column(map.fleet),
    hire_date: column(map.hire_date),
    name: options.nameMode === 'separate'
      && options.firstNameCol
      && options.lastNameCol
      ? { kind: 'combined-name', firstNameColumnId: options.firstNameCol, lastNameColumnId: options.lastNameCol }
      : column(map.name),
    retire_date: options.retireMode === 'dob' && options.dobCol
      ? { kind: 'retirement-from-birth-date', columnId: options.dobCol, retirementAge: options.retirementAge ?? 65 }
      : column(map.retire_date),
  }
}

const log = createLogger('upload:mapping')

export function _useColumnMapping(opts: UploadSession): MappingPhase & { _reset: () => void } {
  const userStore = useUserStore()
  const importAttemptsStore = useImportAttemptsStore()
  const mappingOptions = opts.mappingOptions
  const error = ref<string | null>(null)
  let activeRequest = 0

  const sampleRows = computed(() => opts.rawRows.value.slice(0, 3))
  const columnIds = computed(() => opts.preparedSheet.value?.columns.map(column => column.id) ?? [])

  const canAdvance = computed(() => {
    const pluginRequired = getImportPlugin(opts.selectedUploadTypeId.value ?? '')?.requiredMappings
    return hasRequiredImportMappings(
      toConfirmedMappings(opts.columnMap.value, mappingOptions.value),
      pluginRequired,
      { retirementFromBirthDate: mappingOptions.value.retireMode === 'dob' },
    )
  })

  async function apply() {
    const request = ++activeRequest
    error.value = null
    try {
      opts.progress.report('mapping', 0, opts.rawRows.value.length)

      const plugin = getImportPlugin(opts.selectedUploadTypeId.value ?? '')
      const processed = plugin && opts.preparedSheet.value
        ? await processConfirmedMappings({
            preparedSheet: opts.preparedSheet.value,
            mappings: toConfirmedMappings(opts.columnMap.value, mappingOptions.value),
            plugin,
          })
        : undefined
      if (request !== activeRequest) throw new DOMException('A newer mapping request replaced this one.', 'AbortError')
      if (!processed || !plugin || !opts.preparedSheet.value) {
        throw new Error('Choose an Upload Type before mapping columns.')
      }
      const mapped = processed.drafts.map(draft => draft.entry)

      if (mapped.length === 0) {
        error.value = 'No rows could be mapped. Verify the selected columns contain data.'
        log.warn('Mapping produced zero rows')
        return
      }

      if (plugin && opts.preparedSheet.value) {
        const confirmedMappings = toConfirmedMappings(opts.columnMap.value, mappingOptions.value)
        const columns: Record<string, string> = {}
        for (const [field, columnId] of Object.entries(opts.columnMap.value)) {
          if (columnId) columns[field] = columnId
        }
        try {
          const existing = await userStore.getPreference('importMappings') ?? {}
          await userStore.savePreference('importMappings', { ...existing, [plugin.id]: { columns, mappingOptions: mappingOptions.value } })
          const existingAttemptId = opts.importAttemptId?.value
          if (existingAttemptId) {
            await importAttemptsStore.updateTrace(existingAttemptId, trace => ({
              ...trace,
              mapping: {
                confirmedMappings,
                processedDrafts: processed.drafts,
                transformationIssues: processed.drafts.flatMap(draft => draft.issues),
              },
              stage: 'mapped',
              updatedAt: new Date().toISOString(),
            }))
          } else {
            const now = new Date().toISOString()
            const attemptId = await importAttemptsStore.record({
              id: crypto.randomUUID(),
              pluginId: plugin.id,
              sheetName: opts.preparedSheet.value.sourceSheet.name,
              data: {
                diagnosticSchemaVersion: 3,
                appBuildVersion: 'local',
                plugin: { id: plugin.id, label: plugin.label },
                file: { name: 'unknown' },
                createdAt: now,
                stage: 'mapped',
                outcome: 'review',
                sourceSheet: opts.preparedSheet.value.sourceSheet,
                preparation: { headerRowIndex: 0, patch: {}, preparedSheet: opts.preparedSheet.value, issues: opts.preparationIssues?.value ?? [], metadata: { effectiveDate: opts.extractedEffectiveDate.value, title: opts.extractedTitle.value } },
                mapping: { confirmedMappings, processedDrafts: processed.drafts, transformationIssues: processed.drafts.flatMap(draft => draft.issues) },
              },
            })
            if (opts.importAttemptId) opts.importAttemptId.value = attemptId
          }
        } catch (storageError) {
          log.warn('Could not save import preferences or diagnostic', { error: String(storageError) })
        }
      }

      log.debug('Mapping complete', { entryCount: mapped.length })

      const rowIssues = new Map<number, ImportIssue[]>(processed?.drafts
        .map((draft, index) => [index, draft.issues] as const)
        .filter(([, issues]) => issues.length > 0)
        .map(([index, issues]) => [index, [...issues]] as const) ?? [])
      const sourceValues = new Map(processed.drafts.map((draft, index) => [
        index,
        { ...(opts.preparedSheet.value!.rows.find(row => row.sourceRowId === draft.sourceRowId)?.cells ?? {}) },
      ] as const))
      await opts.onMapped(mapped, rowIssues, sourceValues)

      log.debug('Validation complete')

      opts.onMetadataReady(
        opts.extractedEffectiveDate.value,
        opts.extractedTitle.value,
      )
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      error.value = `Failed to map columns: ${detail}`
      if (opts.importAttemptId?.value) {
        await importAttemptsStore.complete(opts.importAttemptId.value, { outcome: 'failed', error: detail })
      }
      log.error('Mapping failed', { error: detail })
    } finally {
      opts.progress.idle()
    }
  }

  function reset() {
    activeRequest++
    opts.columnMap.value = { ...DEFAULT_COLUMN_MAP }
    mappingOptions.value = { ...DEFAULT_MAPPING_OPTIONS }
  }

  return {
    columnMap: opts.columnMap,
    mappingOptions,
    headers: opts.rawHeaders,
    columnIds,
    sampleRows,
    canAdvance,
    error: readonly(error),
    apply,
    _reset: reset,
  }
}
