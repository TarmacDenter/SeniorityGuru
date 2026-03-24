// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { localEntryToSeniorityEntry } from './db-adapters'
import type { LocalSeniorityEntry } from './db'

describe('localEntryToSeniorityEntry', () => {
  it('maps camelCase fields to snake_case SeniorityEntry', () => {
    const local: LocalSeniorityEntry = {
      id: 1,
      listId: 10,
      seniorityNumber: 42,
      employeeNumber: 'E123',
      name: 'Jane Doe',
      seat: 'CA',
      base: 'LAX',
      fleet: 'B737',
      hireDate: '2010-06-15',
      retireDate: '2040-06-15',
    }

    const entry = localEntryToSeniorityEntry(local)

    expect(entry.seniority_number).toBe(42)
    expect(entry.employee_number).toBe('E123')
    expect(entry.name).toBe('Jane Doe')
    expect(entry.seat).toBe('CA')
    expect(entry.base).toBe('LAX')
    expect(entry.fleet).toBe('B737')
    expect(entry.hire_date).toBe('2010-06-15')
    expect(entry.retire_date).toBe('2040-06-15')
  })

  it('handles null name', () => {
    const local: LocalSeniorityEntry = {
      listId: 1, seniorityNumber: 1, employeeNumber: 'E001',
      name: null, seat: 'FO', base: 'JFK', fleet: 'A320',
      hireDate: '2015-01-01', retireDate: '2045-01-01',
    }
    const entry = localEntryToSeniorityEntry(local)
    expect(entry.name).toBeUndefined()
  })
})
