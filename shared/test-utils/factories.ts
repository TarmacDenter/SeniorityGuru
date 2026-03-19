import type { SeniorityEntry, SeniorityEntryResponse, SeniorityListResponse } from '#shared/schemas/seniority-list'
import type { ProfileResponse } from '#shared/schemas/settings'

export function makeEntry(overrides: Partial<SeniorityEntryResponse> = {}): SeniorityEntryResponse {
  return {
    id: 'entry-1',
    list_id: 'list-1',
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

/** Domain-level entry factory for engine-layer tests (no id/list_id DTO fields). */
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

export function makeProfile(overrides: Partial<ProfileResponse> = {}): ProfileResponse {
  return {
    id: 'user-1',
    role: 'user',
    icao_code: 'DAL',
    employee_number: '500',
    created_at: '2026-01-01T00:00:00Z',
    mandatory_retirement_age: 65,
    ...overrides,
  }
}

export function makeList(overrides: Partial<SeniorityListResponse> = {}): SeniorityListResponse {
  return {
    id: 'list-1',
    airline: 'DAL',
    effective_date: '2026-01-15',
    created_at: '2026-01-15T00:00:00Z',
    title: null,
    ...overrides,
  }
}
