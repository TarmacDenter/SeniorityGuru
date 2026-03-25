import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { useSeniorityUpload } from './useSeniorityUpload'
import { makePartialEntry, makeDomainEntry } from '~/test-utils/factories'

const mockStore = vi.hoisted(() => ({
  addList: vi.fn(),
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))

describe('useSeniorityUpload', () => {
  describe('deleteRow — uses original index, not filtered index', () => {
    it('removes the correct entry by original index', () => {
      const { entries, rowErrors, deleteRow } = useSeniorityUpload()

      // Set up 5 entries: indices 0..4
      entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 3, employee_number: '300' }),
        makePartialEntry({ seniority_number: 4, employee_number: '400' }),
        makePartialEntry({ seniority_number: 5, employee_number: '500' }),
      ]
      // Row 1 and 3 have errors
      rowErrors.value = new Map([
        [1, ['some error']],
        [3, ['another error']],
      ])

      // Delete original index 3 (the entry with employee_number '400')
      deleteRow(3)

      expect(entries.value).toHaveLength(4)
      expect(entries.value.map(e => e.employee_number)).toEqual(['100', '200', '300', '500'])
    })

    it('shifts error map correctly after deletion', () => {
      const { entries, rowErrors, deleteRow } = useSeniorityUpload()

      entries.value = [
        makePartialEntry({ seniority_number: 1 }),
        makePartialEntry({ seniority_number: 2 }),
        makePartialEntry({ seniority_number: 3 }),
        makePartialEntry({ seniority_number: 4 }),
      ]
      rowErrors.value = new Map([
        [0, ['error on 0']],
        [2, ['error on 2']],
        [3, ['error on 3']],
      ])

      // Delete index 1 — errors at 2 and 3 should shift to 1 and 2
      deleteRow(1)

      expect(rowErrors.value.has(0)).toBe(true)
      expect(rowErrors.value.has(1)).toBe(true)  // was index 2
      expect(rowErrors.value.has(2)).toBe(true)  // was index 3
      expect(rowErrors.value.has(3)).toBe(false)
    })
  })

  describe('deleteErrorRows — bulk removes all rows with validation errors', () => {
    it('removes all rows that have errors and keeps clean rows', () => {
      const { entries, rowErrors, deleteErrorRows } = useSeniorityUpload()

      entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '900001' }),
        makePartialEntry({ seniority_number: 2, employee_number: '900002' }),
        makePartialEntry({ seniority_number: 3, employee_number: '900003' }),
        makePartialEntry({ seniority_number: 4, employee_number: '900004' }),
        makePartialEntry({ seniority_number: 5, employee_number: '900005' }),
      ]
      rowErrors.value = new Map([
        [1, ['retire_date: Invalid']],
        [3, ['retire_date: Invalid']],
      ])

      const deleted = deleteErrorRows()

      expect(deleted).toBe(2)
      expect(entries.value).toHaveLength(3)
      expect(entries.value.map(e => e.employee_number)).toEqual(['900001', '900003', '900005'])
    })

    it('returns 0 when no errors exist', () => {
      const { entries, rowErrors, deleteErrorRows } = useSeniorityUpload()

      entries.value = [
        makePartialEntry({ seniority_number: 1 }),
        makePartialEntry({ seniority_number: 2 }),
      ]
      rowErrors.value = new Map()

      const deleted = deleteErrorRows()

      expect(deleted).toBe(0)
      expect(entries.value).toHaveLength(2)
    })
  })

  describe('updateCell — modifies the correct entry', () => {
    it('updates the cell at the given original index', () => {
      const { entries, updateCell } = useSeniorityUpload()

      entries.value = [
        makePartialEntry({ seniority_number: 1, name: 'Alice' }),
        makePartialEntry({ seniority_number: 2, name: 'Bob' }),
        makePartialEntry({ seniority_number: 3, name: 'Charlie' }),
      ]

      updateCell(1, 'name', 'Robert')

      expect(entries.value[1]!.name).toBe('Robert')
      // Others unchanged
      expect(entries.value[0]!.name).toBe('Alice')
      expect(entries.value[2]!.name).toBe('Charlie')
    })
  })

  describe('applyMapping — effective date defaults to today', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('sets effectiveDate to today, not the most recent hire date', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))

      const { rawRows, columnMap, mappingOptions, effectiveDate, applyMapping } = useSeniorityUpload()

      // Set up raw rows with hire dates in the past
      rawRows.value = [
        ['1', '100', 'CA', 'LAX', '737', 'Pilot A', '2020-06-15', '2050-01-01'],
        ['2', '200', 'FO', 'ORD', '737', 'Pilot B', '2023-11-01', '2055-01-01'],
      ]
      columnMap.value = {
        seniority_number: 0,
        employee_number: 1,
        seat: 2,
        base: 3,
        fleet: 4,
        name: 5,
        hire_date: 6,
        retire_date: 7,
      }
      mappingOptions.value = { nameMode: 'single', retireMode: 'direct' }

      applyMapping()

      // Should be today (2026-03-15), NOT the most recent hire date (2023-11-01)
      expect(effectiveDate.value).not.toBeNull()
      expect(effectiveDate.value!.toString()).toBe('2026-03-15')
    })

    it('sets effectiveDate even when no hire dates are present', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))

      const { rawRows, columnMap, mappingOptions, effectiveDate, applyMapping } = useSeniorityUpload()

      rawRows.value = [
        ['1', '100', 'CA', 'LAX', '737', 'Pilot A', '', '2050-01-01'],
      ]
      columnMap.value = {
        seniority_number: 0,
        employee_number: 1,
        seat: 2,
        base: 3,
        fleet: 4,
        name: 5,
        hire_date: 6,
        retire_date: 7,
      }
      mappingOptions.value = { nameMode: 'single', retireMode: 'direct' }

      applyMapping()

      expect(effectiveDate.value).not.toBeNull()
      expect(effectiveDate.value!.toString()).toBe('2026-03-15')
    })
  })

  describe('validate — contiguous seniority number checks', () => {
    it('flags non-contiguous seniority numbers (gap)', () => {
      const { entries, rowErrors, validate } = useSeniorityUpload()

      // 1, 2, 4 — gap at 3
      entries.value = [
        makePartialEntry({ seniority_number: 1 }),
        makePartialEntry({ seniority_number: 2 }),
        makePartialEntry({ seniority_number: 4 }),
      ]

      validate()

      // The entry with seniority_number 4 should be flagged (it's at index 2)
      const allErrors = Array.from(rowErrors.value.values()).flat()
      const hasGapError = allErrors.some(e => /gap|contiguous|non-contiguous|sequence/i.test(e))
      expect(hasGapError).toBe(true)
    })

    it('flags duplicate seniority numbers', () => {
      const { entries, rowErrors, validate } = useSeniorityUpload()

      entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 2, employee_number: '300' }),
      ]

      validate()

      const allErrors = Array.from(rowErrors.value.values()).flat()
      const hasDupError = allErrors.some(e => /duplicate/i.test(e))
      expect(hasDupError).toBe(true)
    })

    it('passes for valid contiguous sequence 1..N', () => {
      const { entries, rowErrors, validate } = useSeniorityUpload()

      entries.value = [
        makePartialEntry({ seniority_number: 1 }),
        makePartialEntry({ seniority_number: 2 }),
        makePartialEntry({ seniority_number: 3 }),
      ]

      validate()

      expect(rowErrors.value.size).toBe(0)
    })
  })

  describe('pre-parser integration', () => {
    it('exposes selectedParserId defaulting to null', () => {
      const { selectedParserId } = useSeniorityUpload()
      expect(selectedParserId.value).toBeNull()
    })

    it('exposes autoDetectSucceeded defaulting to false', () => {
      const { autoDetectSucceeded } = useSeniorityUpload()
      expect(autoDetectSucceeded.value).toBe(false)
    })

    it('exposes extractedEffectiveDate and extractedTitle defaulting to null', () => {
      const { extractedEffectiveDate, extractedTitle } = useSeniorityUpload()
      expect(extractedEffectiveDate.value).toBeNull()
      expect(extractedTitle.value).toBeNull()
    })

    it('applyMapping uses extractedEffectiveDate when available', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))

      const { rawRows, columnMap, mappingOptions, effectiveDate, extractedEffectiveDate, applyMapping } = useSeniorityUpload()

      rawRows.value = [
        ['1', '900001', 'CA', 'LAX', '737', 'MCFLYGUY, MARTY J', '2099-01-15', '2164-01-15'],
      ]
      columnMap.value = {
        seniority_number: 0, employee_number: 1, seat: 2,
        base: 3, fleet: 4, name: 5, hire_date: 6, retire_date: 7,
      }
      mappingOptions.value = { nameMode: 'single', retireMode: 'direct' }
      extractedEffectiveDate.value = '2026-03-01'

      applyMapping()

      expect(effectiveDate.value!.toString()).toBe('2026-03-01')

      vi.useRealTimers()
    })

    it('applyMapping uses extractedTitle when available', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))

      const { rawRows, columnMap, mappingOptions, title, extractedTitle, applyMapping } = useSeniorityUpload()

      rawRows.value = [
        ['1', '900001', 'CA', 'LAX', '737', 'SKYWALKER, LUKE A', '2099-01-15', '2164-01-15'],
      ]
      columnMap.value = {
        seniority_number: 0, employee_number: 1, seat: 2,
        base: 3, fleet: 4, name: 5, hire_date: 6, retire_date: 7,
      }
      mappingOptions.value = { nameMode: 'single', retireMode: 'direct' }
      extractedTitle.value = 'Seniority List 01MAR2026'

      applyMapping()

      expect(title.value).toBe('Seniority List 01MAR2026')

      vi.useRealTimers()
    })

    it('reset clears parser-related state', () => {
      const { selectedParserId, extractedEffectiveDate, extractedTitle, autoDetectSucceeded, reset } = useSeniorityUpload()

      selectedParserId.value = 'delta'
      extractedEffectiveDate.value = '2026-03-01'
      extractedTitle.value = 'Some title'
      autoDetectSucceeded.value = true

      reset()

      expect(selectedParserId.value).toBeNull()
      expect(extractedEffectiveDate.value).toBeNull()
      expect(extractedTitle.value).toBeNull()
      expect(autoDetectSucceeded.value).toBe(false)
    })
  })

  describe('save', () => {
    beforeEach(() => {
      mockStore.addList.mockResolvedValue(99)
    })

    it('calls store.addList with list data and mapped entries, returns entry count', async () => {
      const { entries, effectiveDate, title, save } = useSeniorityUpload()

      entries.value = [
        makeDomainEntry({ seniority_number: 1, employee_number: 'E001', seat: 'CA', base: 'LAX', fleet: 'B737', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
        makeDomainEntry({ seniority_number: 2, employee_number: 'E002', seat: 'FO', base: 'LAX', fleet: 'B737', hire_date: '2012-01-01', retire_date: '2042-01-01' }),
      ]
      effectiveDate.value = { toString: () => '2025-01-01' } as never
      title.value = 'Jan 2025'

      const count = await save()

      expect(mockStore.addList).toHaveBeenCalledWith(
        { title: 'Jan 2025', effectiveDate: '2025-01-01' },
        expect.arrayContaining([
          expect.objectContaining({ employeeNumber: 'E001', seniorityNumber: 1 }),
          expect.objectContaining({ employeeNumber: 'E002', seniorityNumber: 2 }),
        ]),
      )
      expect(count).toBe(2)
    })

    it('uses null for title when title is blank', async () => {
      const { entries, effectiveDate, title, save } = useSeniorityUpload()

      entries.value = [makeDomainEntry({ seniority_number: 1, employee_number: 'E001', seat: 'CA', base: 'LAX', fleet: 'B737', hire_date: '2010-01-01', retire_date: '2040-01-01' })]
      effectiveDate.value = { toString: () => '2025-01-01' } as never
      title.value = ''

      await save()

      expect(mockStore.addList).toHaveBeenCalledWith(
        expect.objectContaining({ title: null }),
        expect.any(Array),
      )
    })
  })
})
