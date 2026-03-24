import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { LocalSeniorityList } from '~/utils/db'

// Auto-increments so that multiple makeEntry() calls in the same test produce
// unique seniority_number / employee_number values without callers needing to
// think about it. Resets naturally per test file (each file is its own module).
let _seq = 0

export function makeEntry(overrides: Partial<SeniorityEntry> = {}): SeniorityEntry {
  const seq = ++_seq
  return {
    seniority_number: seq,
    employee_number: String(seq * 1000),
    name: 'Test Pilot',
    hire_date: '2010-01-15',
    base: 'JFK',
    seat: 'CA',
    fleet: '737',
    retire_date: '2035-06-15',
    ...overrides,
  }
}

/** Domain-level entry factory with fixed defaults — use when seniority_number/employee_number are always explicitly overridden. */
export function makeDomainEntry(overrides: Partial<SeniorityEntry> = {}): SeniorityEntry {
  return {
    seniority_number: 1,
    employee_number: '100',
    name: 'Test Pilot',
    hire_date: '2010-01-15',
    base: 'JFK',
    seat: 'CA',
    fleet: '737',
    retire_date: '2035-06-15',
    ...overrides,
  }
}

export function makeList(overrides: Partial<LocalSeniorityList> = {}): LocalSeniorityList {
  return {
    id: 1,
    title: null,
    effectiveDate: '2026-01-15',
    createdAt: '2026-01-15T00:00:00Z',
    ...overrides,
  }
}

export function makePartialEntry(overrides: Partial<SeniorityEntry> = {}): Partial<SeniorityEntry> {
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
