// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  SeniorityEntrySchema,
  SeniorityListIdSchema,
  CreateSeniorityListSchema,
  UpdateSeniorityListSchema,
  SeniorityListResponseSchema,
  SeniorityEntryResponseSchema,
  CreateSeniorityListResponseSchema,
  normalizeEmployeeNumber,
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
  it('accepts title and effective_date', () => {
    const result = UpdateSeniorityListSchema.safeParse({
      title: 'January List',
      effective_date: '2026-03-01',
    })
    expect(result.success).toBe(true)
  })

  it('accepts title alone', () => {
    const result = UpdateSeniorityListSchema.safeParse({ title: 'Q1 Seniority' })
    expect(result.success).toBe(true)
  })

  it('accepts effective_date alone', () => {
    const result = UpdateSeniorityListSchema.safeParse({ effective_date: '2026-06-15' })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = UpdateSeniorityListSchema.safeParse({ title: '' })
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

  it('does NOT accept airline field', () => {
    const result = UpdateSeniorityListSchema.safeParse({ airline: 'Delta' })
    expect(result.success).toBe(false)
  })

  it('strips airline field when passed alongside valid fields', () => {
    const result = UpdateSeniorityListSchema.safeParse({
      airline: 'Delta',
      effective_date: '2026-03-01',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('airline')
    }
  })
})

describe('CreateSeniorityListSchema title field', () => {
  const validEntry = {
    seniority_number: 1,
    employee_number: '12345',
    seat: 'CA',
    base: 'JFK',
    fleet: '737',
    hire_date: '2010-01-15',
  }

  it('accepts optional title in create payload', () => {
    const result = CreateSeniorityListSchema.safeParse({
      effective_date: '2026-01-15',
      entries: [validEntry],
      title: 'January List',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('January List')
    }
  })

  it('accepts create payload without title', () => {
    const result = CreateSeniorityListSchema.safeParse({
      effective_date: '2026-01-15',
      entries: [validEntry],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty string title in create payload', () => {
    const result = CreateSeniorityListSchema.safeParse({
      effective_date: '2026-01-15',
      entries: [validEntry],
      title: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('SeniorityListResponseSchema', () => {
  const valid = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    airline: 'DAL',
    title: 'January 2026 List',
    effective_date: '2026-01-15',
    status: 'active',
    created_at: '2026-01-10T12:00:00Z',
  }

  it('validates correct shape with all required fields', () => {
    expect(SeniorityListResponseSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts nullable title', () => {
    expect(SeniorityListResponseSchema.safeParse({ ...valid, title: null }).success).toBe(true)
  })

  it('rejects missing id', () => {
    const { id, ...noId } = valid
    expect(SeniorityListResponseSchema.safeParse(noId).success).toBe(false)
  })

  it('rejects missing airline', () => {
    const { airline, ...noAirline } = valid
    expect(SeniorityListResponseSchema.safeParse(noAirline).success).toBe(false)
  })

  it('rejects missing effective_date', () => {
    const { effective_date, ...noDate } = valid
    expect(SeniorityListResponseSchema.safeParse(noDate).success).toBe(false)
  })

  it('rejects missing status', () => {
    const { status, ...noStatus } = valid
    expect(SeniorityListResponseSchema.safeParse(noStatus).success).toBe(false)
  })

  it('rejects missing created_at', () => {
    const { created_at, ...noCreated } = valid
    expect(SeniorityListResponseSchema.safeParse(noCreated).success).toBe(false)
  })
})

describe('SeniorityEntryResponseSchema', () => {
  const valid = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    list_id: '660e8400-e29b-41d4-a716-446655440000',
    seniority_number: 42,
    employee_number: '12345',
    name: 'Smith, John',
    seat: 'CA',
    base: 'JFK',
    fleet: '737',
    hire_date: '2010-01-15',
    retire_date: '2035-06-15',
  }

  it('validates correct shape with all required fields', () => {
    expect(SeniorityEntryResponseSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts nullable name', () => {
    expect(SeniorityEntryResponseSchema.safeParse({ ...valid, name: null }).success).toBe(true)
  })

  it('accepts nullable seat', () => {
    expect(SeniorityEntryResponseSchema.safeParse({ ...valid, seat: null }).success).toBe(true)
  })

  it('accepts nullable base', () => {
    expect(SeniorityEntryResponseSchema.safeParse({ ...valid, base: null }).success).toBe(true)
  })

  it('accepts nullable fleet', () => {
    expect(SeniorityEntryResponseSchema.safeParse({ ...valid, fleet: null }).success).toBe(true)
  })

  it('accepts nullable retire_date', () => {
    expect(SeniorityEntryResponseSchema.safeParse({ ...valid, retire_date: null }).success).toBe(true)
  })

  it('rejects missing id', () => {
    const { id, ...noId } = valid
    expect(SeniorityEntryResponseSchema.safeParse(noId).success).toBe(false)
  })

  it('rejects missing list_id', () => {
    const { list_id, ...noListId } = valid
    expect(SeniorityEntryResponseSchema.safeParse(noListId).success).toBe(false)
  })

  it('rejects missing seniority_number', () => {
    const { seniority_number, ...noSenNum } = valid
    expect(SeniorityEntryResponseSchema.safeParse(noSenNum).success).toBe(false)
  })

  it('rejects missing employee_number', () => {
    const { employee_number, ...noEmpNum } = valid
    expect(SeniorityEntryResponseSchema.safeParse(noEmpNum).success).toBe(false)
  })

  it('rejects missing hire_date', () => {
    const { hire_date, ...noHireDate } = valid
    expect(SeniorityEntryResponseSchema.safeParse(noHireDate).success).toBe(false)
  })
})

describe('CreateSeniorityListResponseSchema', () => {
  it('validates { id: uuid, count: number }', () => {
    const result = CreateSeniorityListResponseSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      count: 150,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    const result = CreateSeniorityListResponseSchema.safeParse({ count: 150 })
    expect(result.success).toBe(false)
  })

  it('rejects missing count', () => {
    const result = CreateSeniorityListResponseSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })
})
