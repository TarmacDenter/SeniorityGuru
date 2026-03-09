// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  SeniorityEntrySchema,
  SeniorityListIdSchema,
  CreateSeniorityListSchema,
  UpdateSeniorityListSchema,
  normalizeEmployeeNumber,
  normalizeDate,
  computeRetireDate,
} from './seniority-list'

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

describe('normalizeDate', () => {
  it('passes through YYYY-MM-DD unchanged', () => {
    expect(normalizeDate('2010-01-15')).toBe('2010-01-15')
  })
  it('converts MM/DD/YYYY', () => {
    expect(normalizeDate('01/15/2010')).toBe('2010-01-15')
  })
  it('converts M/D/YYYY (no leading zeroes)', () => {
    expect(normalizeDate('1/5/2010')).toBe('2010-01-05')
  })
  it('converts MM-DD-YYYY', () => {
    expect(normalizeDate('06-15-1970')).toBe('1970-06-15')
  })
  it('converts M/D/YY with 2-digit year (<=50 = 2000s)', () => {
    expect(normalizeDate('3/7/10')).toBe('2010-03-07')
  })
  it('converts M/D/YY with 2-digit year (>50 = 1900s)', () => {
    expect(normalizeDate('3/7/70')).toBe('1970-03-07')
  })
  it('converts Excel serial number', () => {
    // 40193 = Jan 15, 2010 in Excel
    expect(normalizeDate('40193')).toBe('2010-01-15')
  })
  it('returns original string for unparseable input', () => {
    expect(normalizeDate('not-a-date')).toBe('not-a-date')
  })
  it('handles empty string', () => {
    expect(normalizeDate('')).toBe('')
  })
  it('trims whitespace', () => {
    expect(normalizeDate('  01/15/2010  ')).toBe('2010-01-15')
  })
})

describe('computeRetireDate', () => {
  it('adds retirement age to DOB', () => {
    expect(computeRetireDate('1970-06-15', 65)).toBe('2035-06-15')
  })
  it('handles leap day DOB', () => {
    expect(computeRetireDate('1960-02-29', 65)).toBe('2025-02-28')
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
  }

  it('accepts a valid entry with required fields only', () => {
    expect(SeniorityEntrySchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a full entry with all optional fields', () => {
    const full = { ...valid, name: 'Smith, John', retire_date: '2035-06-15' }
    expect(SeniorityEntrySchema.safeParse(full).success).toBe(true)
  })

  it('rejects missing hire_date', () => {
    const { hire_date, ...noHire } = valid
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

describe('SeniorityListIdSchema', () => {
  it('accepts a valid UUID', () => {
    const result = SeniorityListIdSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.success).toBe(true)
  })

  it('rejects a non-UUID string', () => {
    const result = SeniorityListIdSchema.safeParse({ id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects missing id', () => {
    const result = SeniorityListIdSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('CreateSeniorityListSchema', () => {
  const validEntry = {
    seniority_number: 1,
    employee_number: '12345',
    seat: 'CA',
    base: 'JFK',
    fleet: '737',
    hire_date: '2010-01-15',
  }

  it('accepts a valid list payload', () => {
    const result = CreateSeniorityListSchema.safeParse({
      effective_date: '2026-01-15',
      entries: [validEntry],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty entries array', () => {
    const result = CreateSeniorityListSchema.safeParse({
      effective_date: '2026-01-15',
      entries: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing effective_date', () => {
    const result = CreateSeniorityListSchema.safeParse({
      entries: [validEntry],
    })
    expect(result.success).toBe(false)
  })
})

describe('UpdateSeniorityListSchema', () => {
  it('accepts valid airline and effective_date', () => {
    const result = UpdateSeniorityListSchema.safeParse({
      airline: 'United Airlines',
      effective_date: '2026-03-01',
    })
    expect(result.success).toBe(true)
  })

  it('accepts airline alone', () => {
    const result = UpdateSeniorityListSchema.safeParse({ airline: 'Delta' })
    expect(result.success).toBe(true)
  })

  it('accepts effective_date alone', () => {
    const result = UpdateSeniorityListSchema.safeParse({ effective_date: '2026-06-15' })
    expect(result.success).toBe(true)
  })

  it('rejects empty airline', () => {
    const result = UpdateSeniorityListSchema.safeParse({ airline: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid effective_date format', () => {
    const result = UpdateSeniorityListSchema.safeParse({ effective_date: '03/01/2026' })
    expect(result.success).toBe(false)
  })

  it('rejects empty object (at least one field required)', () => {
    const result = UpdateSeniorityListSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
