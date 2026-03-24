// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { SeniorityEntrySchema, normalizeEmployeeNumber } from './seniority-list'

describe('normalizeEmployeeNumber', () => {
  it('strips leading zeroes from numeric strings', () => {
    expect(normalizeEmployeeNumber('007123')).toBe('7123')
  })
  it('preserves non-numeric strings as-is', () => {
    expect(normalizeEmployeeNumber('AB-123')).toBe('AB-123')
  })
  it('handles single zero', () => {
    expect(normalizeEmployeeNumber('0')).toBe('0')
  })
  it('handles already-clean numbers', () => {
    expect(normalizeEmployeeNumber('12345')).toBe('12345')
  })
})

describe('SeniorityEntrySchema', () => {
  const valid = {
    seniority_number: 1,
    employee_number: '12345',
    seat: 'CA',
    base: 'JFK',
    fleet: '737',
    hire_date: '2010-01-15',
    retire_date: '2050-02-14',
  }

  it('accepts a valid entry with required fields only', () => {
    expect(SeniorityEntrySchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a full entry with all optional fields', () => {
    const full = { ...valid, name: 'Smith, John', retire_date: '2035-06-15' }
    expect(SeniorityEntrySchema.safeParse(full).success).toBe(true)
  })

  it('rejects missing hire_date', () => {
    const { hire_date: _, ...noHire } = valid
    expect(SeniorityEntrySchema.safeParse(noHire).success).toBe(false)
  })

  it('rejects seniority_number <= 0', () => {
    expect(SeniorityEntrySchema.safeParse({ ...valid, seniority_number: 0 }).success).toBe(false)
  })

  it('rejects empty employee_number', () => {
    expect(SeniorityEntrySchema.safeParse({ ...valid, employee_number: '' }).success).toBe(false)
  })

  it('rejects empty seat', () => {
    expect(SeniorityEntrySchema.safeParse({ ...valid, seat: '' }).success).toBe(false)
  })

  it('rejects empty base', () => {
    expect(SeniorityEntrySchema.safeParse({ ...valid, base: '' }).success).toBe(false)
  })

  it('rejects empty fleet', () => {
    expect(SeniorityEntrySchema.safeParse({ ...valid, fleet: '' }).success).toBe(false)
  })

  it('rejects invalid hire_date', () => {
    expect(SeniorityEntrySchema.safeParse({ ...valid, hire_date: 'not-a-date' }).success).toBe(false)
  })
})
