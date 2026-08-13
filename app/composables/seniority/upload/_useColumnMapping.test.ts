import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _useColumnMapping } from './_useColumnMapping'
import { _useProgressTracker } from './_useProgressTracker'
import type { ColumnMap } from '~/utils/parse-spreadsheet'
import type { PreparedSheet } from '~/utils/import-pipeline/types'

const { mockProcessConfirmedMappings } = vi.hoisted(() => ({
  mockProcessConfirmedMappings: vi.fn(),
}))

vi.mock('~/utils/import-pipeline/process-confirmed-mappings', () => ({ processConfirmedMappings: mockProcessConfirmedMappings }))

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
  const mappingOptions = ref<MappingOptions>({ nameMode: 'single', retireMode: 'direct' })
  const extractedEffectiveDate = ref<string | null>(null)
  const extractedTitle = ref<string | null>(null)
  const selectedParserId = ref<string | null>('generic')
  const preparedSheet = ref<PreparedSheet | null>({
    sourceSheet: { id: 'sheet:0', name: 'Sheet 1', columns: [], rows: [] },
    columns: ['seniority_number', 'employee_number', 'seat', 'base', 'fleet', 'name', 'hire_date', 'retire_date'].map(id => ({ id, label: id })),
    rows: [{ sourceRowId: 'row:1', cells: { seniority_number: '1' } }],
  })
  const progress = _useProgressTracker()
  const onMapped = overrides.onMapped ?? vi.fn()
  const onMetadataReady = overrides.onMetadataReady ?? vi.fn()

  const mapping = _useColumnMapping({
    rawRows,
    rawHeaders,
    columnMap,
    mappingOptions,
    progress,
    extractedEffectiveDate,
    extractedTitle,
    selectedParserId,
    preparedSheet,
    onMapped,
    onMetadataReady,
  })

  return { mapping, rawRows, rawHeaders, columnMap, extractedEffectiveDate, extractedTitle, selectedParserId, preparedSheet, progress, onMapped, onMetadataReady }
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
      mockProcessConfirmedMappings.mockResolvedValueOnce({ drafts: [{ id: 'draft:row:1', sourceRowId: 'row:1', entry: { seniority_number: 1 }, issues: [] }] })
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

  describe('apply — error handling', () => {
    beforeEach(() => {
      mockProcessConfirmedMappings.mockReset()
    })

    it('sets error.value when processing throws and does not call onMapped', async () => {
      mockProcessConfirmedMappings.mockRejectedValueOnce(new Error('row transform failed'))
      const onMapped = vi.fn()
      const { mapping } = createMapping({ onMapped })

      await mapping.apply()

      expect(mapping.error.value).toBe('Failed to map columns: row transform failed')
      expect(onMapped).not.toHaveBeenCalled()
    })

    it('sets error.value when mapped result is empty and does not call onMapped', async () => {
      mockProcessConfirmedMappings.mockResolvedValueOnce({ drafts: [] })
      const onMapped = vi.fn()
      const { mapping } = createMapping({ onMapped })

      await mapping.apply()

      expect(mapping.error.value).toBe('No rows could be mapped. Verify the selected columns contain data.')
      expect(onMapped).not.toHaveBeenCalled()
    })

    it('clears error.value at the start of the next apply() call', async () => {
      mockProcessConfirmedMappings.mockRejectedValueOnce(new Error('first failure'))
      const onMapped = vi.fn()
      const { mapping } = createMapping({ onMapped })

      await mapping.apply()
      expect(mapping.error.value).not.toBeNull()

      mockProcessConfirmedMappings.mockResolvedValueOnce({ drafts: [{ id: 'draft:row:1', sourceRowId: 'row:1', entry: { seniority_number: 1 }, issues: [] }] })
      await mapping.apply()

      expect(mapping.error.value).toBeNull()
    })

    it('error.value is null after a successful apply()', async () => {
      mockProcessConfirmedMappings.mockResolvedValueOnce({ drafts: [{ id: 'draft:row:1', sourceRowId: 'row:1', entry: { seniority_number: 1 }, issues: [] }] })
      const { mapping } = createMapping()

      await mapping.apply()

      expect(mapping.error.value).toBeNull()
    })
  })
})
