import type { MappingPhase, MappingPhaseOptions } from './types'
import type { MappingOptions } from '~/utils/parse-spreadsheet'
import { applyColumnMapAsync } from '~/utils/parse-spreadsheet'
import { createLogger } from '~/utils/logger'
import { DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS } from './defaults'
import { processConfirmedMappings } from '~/utils/import-pipeline/process-confirmed-mappings'
import { getImportPlugin } from '~/utils/import-pipeline/plugins/registry'
import { useUserStore } from '~/stores/user'
import { useImportAttemptsStore } from '~/stores/import-attempts'
import type { ConfirmedMappings, PreparedColumn } from '~/utils/import-pipeline/types'

function toConfirmedMappings(
  map: ColumnMap,
  options: MappingOptions,
  headers: string[],
  columns?: readonly PreparedColumn[],
): ConfirmedMappings {
  const columnId = (index: number) => columns?.[index]?.id ?? headers[index]
  const column = (index: number) => index >= 0 && columnId(index) ? { kind: 'column' as const, columnId: columnId(index)! } : undefined
  const mappings: Partial<Record<keyof ColumnMap, ConfirmedMappings[keyof ConfirmedMappings]>> = {
    seniority_number: column(map.seniority_number),
    employee_number: column(map.employee_number),
    seat: column(map.seat),
    base: column(map.base),
    fleet: column(map.fleet),
    hire_date: column(map.hire_date),
  }

  mappings.name = options.nameMode === 'separate'
    && options.firstNameCol != null
    && options.lastNameCol != null
    && columnId(options.firstNameCol)
    && columnId(options.lastNameCol)
    ? { kind: 'combined-name', firstNameColumnId: columnId(options.firstNameCol)!, lastNameColumnId: columnId(options.lastNameCol)! }
    : column(map.name)
  mappings.retire_date = options.retireMode === 'dob' && options.dobCol != null && columnId(options.dobCol)
    ? { kind: 'retirement-from-birth-date', columnId: columnId(options.dobCol)!, retirementAge: options.retirementAge ?? 65 }
    : column(map.retire_date)
  return mappings as ConfirmedMappings
}

const log = createLogger('upload:mapping')

export function _useColumnMapping(opts: MappingPhaseOptions): MappingPhase & { _reset: () => void } {
  const userStore = useUserStore()
  const importAttemptsStore = useImportAttemptsStore()
  const mappingOptions = ref<MappingOptions>({ ...DEFAULT_MAPPING_OPTIONS })
  const error = ref<string | null>(null)

  const sampleRows = computed(() => opts.rawRows.value.slice(0, 3))

  const canAdvance = computed(() => {
    const m = opts.columnMap.value
    const dobActive = mappingOptions.value.retireMode === 'dob'
    const retireSatisfied = m.retire_date >= 0 || dobActive
    return m.seniority_number >= 0
      && m.employee_number >= 0
      && m.seat >= 0
      && m.base >= 0
      && m.fleet >= 0
      && m.hire_date >= 0
      && retireSatisfied
  })

  async function apply() {
    error.value = null
    try {
      opts.progress.report('mapping', 0, opts.rawRows.value.length)

      const plugin = getImportPlugin(opts.selectedParserId.value ?? '')
      const mapped = plugin && opts.preparedSheet.value
        ? (await processConfirmedMappings({
            preparedSheet: opts.preparedSheet.value,
            mappings: toConfirmedMappings(opts.columnMap.value, mappingOptions.value, opts.rawHeaders.value, opts.preparedSheet.value.columns),
            plugin,
          })).drafts.map(draft => draft.entry)
        : await applyColumnMapAsync(
            opts.rawRows.value,
            opts.columnMap.value,
            mappingOptions.value,
            (current, total) => {
              opts.progress.report('mapping', current, total)
            },
          )

      if (mapped.length === 0) {
        error.value = 'No rows could be mapped. Verify the selected columns contain data.'
        log.warn('Mapping produced zero rows')
        return
      }

      if (plugin && opts.preparedSheet.value) {
        const columns = Object.fromEntries(Object.entries(opts.columnMap.value)
          .filter(([, index]) => index >= 0)
          .map(([field, index]) => [field, opts.preparedSheet.value!.columns[index]?.id])) as Record<string, string>
        const existing = await userStore.getPreference('importMappings') ?? {}
        await userStore.savePreference('importMappings', { ...existing, [plugin.id]: { columns, mappingOptions: mappingOptions.value } })
        await importAttemptsStore.record({
          id: crypto.randomUUID(),
          pluginId: plugin.id,
          data: { schemaVersion: 1, pluginId: plugin.id, preparedSheet: opts.preparedSheet.value, mappings: columns, drafts: mapped },
        })
      }

      log.debug('Mapping complete', { entryCount: mapped.length })

      await opts.onMapped(mapped)

      log.debug('Validation complete')

      opts.onMetadataReady(
        opts.extractedEffectiveDate.value,
        opts.extractedTitle.value,
      )
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      error.value = `Failed to map columns: ${detail}`
      log.error('Mapping failed', { error: detail })
    } finally {
      opts.progress.idle()
    }
  }

  function reset() {
    opts.columnMap.value = { ...DEFAULT_COLUMN_MAP }
    mappingOptions.value = { ...DEFAULT_MAPPING_OPTIONS }
  }

  return {
    columnMap: opts.columnMap,
    mappingOptions,
    headers: opts.rawHeaders,
    sampleRows,
    canAdvance,
    error: readonly(error),
    apply,
    _reset: reset,
  }
}
