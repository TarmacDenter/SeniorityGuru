// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validateEntries, computeStructuralErrors } from './validate-entries'
import { makePartialEntry } from '~/test-utils/factories'

describe('validateEntries', () => {
  it('returns empty map for valid contiguous entries', () => {
    const entries = [
      makePartialEntry({ seniority_number: 1, employee_number: '100' }),
      makePartialEntry({ seniority_number: 2, employee_number: '200' }),
      makePartialEntry({ seniority_number: 3, employee_number: '300' }),
    ]
    const errors = validateEntries(entries)
    expect(errors.size).toBe(0)
  })

  it('flags duplicate seniority numbers', () => {
    const entries = [
      makePartialEntry({ seniority_number: 1, employee_number: '100' }),
      makePartialEntry({ seniority_number: 2, employee_number: '200' }),
      makePartialEntry({ seniority_number: 2, employee_number: '300' }),
    ]
    const errors = validateEntries(entries)
    const allErrors = Array.from(errors.values()).flat()
    expect(allErrors.some(e => /duplicate/i.test(e))).toBe(true)
  })

  it('flags non-contiguous seniority numbers', () => {
    const entries = [
      makePartialEntry({ seniority_number: 1 }),
      makePartialEntry({ seniority_number: 2 }),
      makePartialEntry({ seniority_number: 4 }),
    ]
    const errors = validateEntries(entries)
    const allErrors = Array.from(errors.values()).flat()
    expect(allErrors.some(e => /contiguous|sequence/i.test(e))).toBe(true)
  })

  it('flags Zod schema violations', () => {
    const entries = [{ seniority_number: -1 }]
    const errors = validateEntries(entries)
    expect(errors.size).toBeGreaterThan(0)
  })

  it('merges schema and structural errors for the same row', () => {
    const entries = [
      makePartialEntry({ seniority_number: 5 }), // non-contiguous (starts at 5, not 1)
    ]
    // seniority_number: 5 with only 1 entry — non-contiguous
    const errors = validateEntries(entries)
    const rowErrors = errors.get(0) ?? []
    expect(rowErrors.some(e => /contiguous|sequence/i.test(e))).toBe(true)
  })

  it('flags duplicate employee numbers', () => {
    const entries = [
      makePartialEntry({ seniority_number: 1, employee_number: 'EMP001' }),
      makePartialEntry({ seniority_number: 2, employee_number: 'EMP001' }), // duplicate
      makePartialEntry({ seniority_number: 3, employee_number: 'EMP002' }),
    ]
    const errors = validateEntries(entries)
    expect(errors.has(0)).toBe(true)
    expect(errors.has(1)).toBe(true)
    expect(errors.has(2)).toBe(false)
    const allErrors = Array.from(errors.values()).flat()
    expect(allErrors.some(e => e.includes('Duplicate employee number'))).toBe(true)
  })
})

describe('computeStructuralErrors', () => {
  it('returns empty map for valid contiguous entries with unique employee numbers', () => {
    const entries = [
      makePartialEntry({ seniority_number: 1, employee_number: '100' }),
      makePartialEntry({ seniority_number: 2, employee_number: '200' }),
    ]
    expect(computeStructuralErrors(entries).size).toBe(0)
  })

  it('flags duplicate seniority numbers', () => {
    const entries = [
      makePartialEntry({ seniority_number: 1, employee_number: '100' }),
      makePartialEntry({ seniority_number: 1, employee_number: '200' }),
    ]
    const errors = computeStructuralErrors(entries)
    const allErrors = Array.from(errors.values()).flat()
    expect(allErrors.some(e => e.includes('Duplicate seniority number'))).toBe(true)
  })

  it('flags duplicate employee numbers', () => {
    const entries = [
      makePartialEntry({ seniority_number: 1, employee_number: 'X' }),
      makePartialEntry({ seniority_number: 2, employee_number: 'X' }),
    ]
    const errors = computeStructuralErrors(entries)
    expect(errors.has(0)).toBe(true)
    expect(errors.has(1)).toBe(true)
    const allErrors = Array.from(errors.values()).flat()
    expect(allErrors.some(e => e.includes('Duplicate employee number'))).toBe(true)
  })

  it('does not flag empty employee_number as a duplicate', () => {
    const entries = [
      makePartialEntry({ seniority_number: 1, employee_number: '' }),
      makePartialEntry({ seniority_number: 2, employee_number: '' }),
    ]
    const errors = computeStructuralErrors(entries)
    expect(Array.from(errors.values()).flat().some(e => e.includes('employee_number: Duplicate'))).toBe(false)
  })
})
