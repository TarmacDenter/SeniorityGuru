import { describe, it, expect } from 'vitest'
import { useSeniorityUpload } from './useSeniorityUpload'
import type { SeniorityEntry } from '#shared/schemas/seniority-list'

function makeEntry(overrides: Partial<SeniorityEntry> = {}): Partial<SeniorityEntry> {
  return {
    seniority_number: 1,
    employee_number: '100',
    name: 'Pilot A',
    seat: 'CA',
    base: 'LAX',
    fleet: '737',
    hire_date: '2020-01-01',
    retire_date: '2050-01-01',
    ...overrides,
  }
}

describe('useSeniorityUpload', () => {
  describe('deleteRow — uses original index, not filtered index', () => {
    it('removes the correct entry by original index', () => {
      const { entries, rowErrors, deleteRow } = useSeniorityUpload()

      // Set up 5 entries: indices 0..4
      entries.value = [
        makeEntry({ seniority_number: 1, employee_number: '100' }),
        makeEntry({ seniority_number: 2, employee_number: '200' }),
        makeEntry({ seniority_number: 3, employee_number: '300' }),
        makeEntry({ seniority_number: 4, employee_number: '400' }),
        makeEntry({ seniority_number: 5, employee_number: '500' }),
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
        makeEntry({ seniority_number: 1 }),
        makeEntry({ seniority_number: 2 }),
        makeEntry({ seniority_number: 3 }),
        makeEntry({ seniority_number: 4 }),
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

  describe('updateCell — modifies the correct entry', () => {
    it('updates the cell at the given original index', () => {
      const { entries, updateCell } = useSeniorityUpload()

      entries.value = [
        makeEntry({ seniority_number: 1, name: 'Alice' }),
        makeEntry({ seniority_number: 2, name: 'Bob' }),
        makeEntry({ seniority_number: 3, name: 'Charlie' }),
      ]

      updateCell(1, 'name', 'Robert')

      expect(entries.value[1]!.name).toBe('Robert')
      // Others unchanged
      expect(entries.value[0]!.name).toBe('Alice')
      expect(entries.value[2]!.name).toBe('Charlie')
    })
  })

  describe('validate — contiguous seniority number checks', () => {
    it('flags non-contiguous seniority numbers (gap)', () => {
      const { entries, rowErrors, validate } = useSeniorityUpload()

      // 1, 2, 4 — gap at 3
      entries.value = [
        makeEntry({ seniority_number: 1 }),
        makeEntry({ seniority_number: 2 }),
        makeEntry({ seniority_number: 4 }),
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
        makeEntry({ seniority_number: 1, employee_number: '100' }),
        makeEntry({ seniority_number: 2, employee_number: '200' }),
        makeEntry({ seniority_number: 2, employee_number: '300' }),
      ]

      validate()

      const allErrors = Array.from(rowErrors.value.values()).flat()
      const hasDupError = allErrors.some(e => /duplicate/i.test(e))
      expect(hasDupError).toBe(true)
    })

    it('passes for valid contiguous sequence 1..N', () => {
      const { entries, rowErrors, validate } = useSeniorityUpload()

      entries.value = [
        makeEntry({ seniority_number: 1 }),
        makeEntry({ seniority_number: 2 }),
        makeEntry({ seniority_number: 3 }),
      ]

      validate()

      expect(rowErrors.value.size).toBe(0)
    })
  })
})
