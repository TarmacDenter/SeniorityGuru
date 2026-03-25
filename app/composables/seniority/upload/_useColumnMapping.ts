import type { MappingPhase, MappingPhaseOptions } from './types'
import type { ColumnMap, MappingOptions } from '~/utils/parse-spreadsheet'
import { applyColumnMapAsync } from '~/utils/parse-spreadsheet'
import { createLogger } from '~/utils/logger'

const log = createLogger('upload:mapping')

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

export function _useColumnMapping(opts: MappingPhaseOptions): MappingPhase & { _reset: () => void } {
  const mappingOptions = ref<MappingOptions>({ ...DEFAULT_MAPPING_OPTIONS })

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
    try {
      opts.progress.report('mapping', 0, opts.rawRows.value.length)

      const mapped = await applyColumnMapAsync(
        opts.rawRows.value,
        opts.columnMap.value,
        mappingOptions.value,
        (current, total) => {
          opts.progress.report('mapping', current, total)
        },
      )

      log.debug('Mapping complete', { entryCount: mapped.length, sampleEntry: mapped[0] })

      await opts.onMapped(mapped)

      log.debug('Validation complete')

      opts.onMetadataReady(
        opts.extractedEffectiveDate.value,
        opts.extractedTitle.value,
      )
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
    apply,
    _reset: reset,
  }
}
