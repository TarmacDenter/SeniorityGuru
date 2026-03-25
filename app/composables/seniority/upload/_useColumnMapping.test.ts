import { describe, it, expect, vi } from 'vitest'
import { _useColumnMapping } from './_useColumnMapping'
import { _useProgressTracker } from './_useProgressTracker'
import type { ColumnMap } from '~/utils/parse-spreadsheet'

function createMapping(overrides: Record<string, any> = {}) {
  const rawRows = ref<string[][]>([])
  const rawHeaders = ref<string[]>([])
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
  const extractedEffectiveDate = ref<string | null>(null)
  const extractedTitle = ref<string | null>(null)
  const progress = _useProgressTracker()
  const onMapped = overrides.onMapped ?? vi.fn()
  const onMetadataReady = overrides.onMetadataReady ?? vi.fn()

  const mapping = _useColumnMapping({
    rawRows,
    rawHeaders,
    columnMap,
    progress,
    extractedEffectiveDate,
    extractedTitle,
    onMapped,
    onMetadataReady,
  })

  return { mapping, rawRows, rawHeaders, columnMap, extractedEffectiveDate, extractedTitle, progress, onMapped, onMetadataReady }
}

describe('_useColumnMapping', () => {
  describe('canAdvance', () => {
    it('is false when no columns are mapped', () => {
      const { mapping } = createMapping()
      expect(mapping.canAdvance.value).toBe(false)
    })

    it('is true when all required columns are mapped', () => {
      const { mapping } = createMapping()
      mapping.columnMap.value = {
        seniority_number: 0,
        employee_number: 1,
        seat: 2,
        base: 3,
        fleet: 4,
        name: 5,
        hire_date: 6,
        retire_date: 7,
      }
      expect(mapping.canAdvance.value).toBe(true)
    })

    it('accepts DOB mode as substitute for retire_date', () => {
      const { mapping } = createMapping()
      mapping.columnMap.value = {
        seniority_number: 0,
        employee_number: 1,
        seat: 2,
        base: 3,
        fleet: 4,
        name: 5,
        hire_date: 6,
        retire_date: -1,
      }
      mapping.mappingOptions.value = { nameMode: 'single', retireMode: 'dob' }
      expect(mapping.canAdvance.value).toBe(true)
    })
  })

  describe('sampleRows', () => {
    it('returns first 3 rows', () => {
      const { mapping, rawRows } = createMapping()
      rawRows.value = [['a'], ['b'], ['c'], ['d'], ['e']]
      expect(mapping.sampleRows.value).toEqual([['a'], ['b'], ['c']])
    })
  })

  describe('apply', () => {
    it('calls onMapped with mapped entries and onMetadataReady', async () => {
      const onMapped = vi.fn()
      const onMetadataReady = vi.fn()
      const { mapping, rawRows, extractedEffectiveDate, extractedTitle } = createMapping({ onMapped, onMetadataReady })

      rawRows.value = [
        ['1', '100', 'CA', 'LAX', '737', 'Pilot A', '2020-06-15', '2050-01-01'],
      ]
      mapping.columnMap.value = {
        seniority_number: 0,
        employee_number: 1,
        seat: 2,
        base: 3,
        fleet: 4,
        name: 5,
        hire_date: 6,
        retire_date: 7,
      }
      extractedEffectiveDate.value = '2026-03-01'
      extractedTitle.value = 'March List'

      await mapping.apply()

      expect(onMapped).toHaveBeenCalledTimes(1)
      const entries = onMapped.mock.calls[0]![0]
      expect(entries).toHaveLength(1)
      expect(entries[0].seniority_number).toBe(1)

      expect(onMetadataReady).toHaveBeenCalledWith('2026-03-01', 'March List')
    })
  })
})
