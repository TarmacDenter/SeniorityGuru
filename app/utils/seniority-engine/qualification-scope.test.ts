// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import {
  COMPANY_WIDE_QUALIFICATION_SCOPE,
  enumerateQualificationScopes,
  qualificationScopesEqual,
  qualificationScopeToEntryPredicate,
  type QualificationScope,
} from './qualification-scope'

const entries = [
  makeDomainEntry({ seniority_number: 100, employee_number: 'E1', base: 'ATL', seat: 'CA', fleet: '737' }),
  makeDomainEntry({ seniority_number: 105, employee_number: 'E2', base: 'ATL', seat: 'FO', fleet: '737' }),
  makeDomainEntry({ seniority_number: 110, employee_number: 'E3', base: 'JFK', seat: 'CA', fleet: '320' }),
  makeDomainEntry({ seniority_number: 125, employee_number: 'E4', base: 'JFK', seat: 'CA', fleet: '737' }),
  makeDomainEntry({ seniority_number: 140, employee_number: 'E5', base: 'ATL', seat: 'CA', fleet: '320' }),
]

describe('Qualification Scope', () => {
  it('uses an empty scope for company-wide analysis', () => {
    expect(COMPANY_WIDE_QUALIFICATION_SCOPE).toEqual({})
    expect(entries.filter(qualificationScopeToEntryPredicate({}))).toEqual(entries)
  })

  it.each([
    [{ fleet: '737' }, ['E1', 'E2', 'E4']],
    [{ seat: 'FO' }, ['E2']],
    [{ base: 'JFK' }, ['E3', 'E4']],
    [{ base: 'ATL', seat: 'CA' }, ['E1', 'E5']],
    [{ base: 'JFK', seat: 'CA', fleet: '737' }, ['E4']],
  ] satisfies [QualificationScope, string[]][])('constrains any populated dimensions in %o', (scope, employeeNumbers) => {
    expect(entries.filter(qualificationScopeToEntryPredicate(scope)).map(entry => entry.employee_number)).toEqual(employeeNumbers)
  })

  it('compares absent dimensions consistently', () => {
    expect(qualificationScopesEqual({ fleet: '737', seat: undefined }, { fleet: '737' })).toBe(true)
    expect(qualificationScopesEqual({ fleet: '737' }, { fleet: '320' })).toBe(false)
    expect(qualificationScopesEqual({ fleet: '737' }, {})).toBe(false)
  })

  it('enumerates company-wide, partial, and populated Qualification scopes without duplicates', () => {
    const scopes = enumerateQualificationScopes(entries)

    expect(scopes[0]).toEqual({})
    expect(scopes).toContainEqual({ base: 'ATL' })
    expect(scopes).toContainEqual({ seat: 'CA', fleet: '737' })
    expect(scopes).toContainEqual({ base: 'JFK', seat: 'CA', fleet: '320' })
    expect(scopes).not.toContainEqual({ base: 'JFK', seat: 'FO' })
    expect(new Set(scopes.map(scope => JSON.stringify(scope))).size).toBe(scopes.length)
  })

  it('orders scopes by dimension count after company-wide', () => {
    const scopes = enumerateQualificationScopes(entries)
    const dimensionCount = (scope: QualificationScope) =>
      Number(!!scope.base) + Number(!!scope.seat) + Number(!!scope.fleet)

    expect(scopes.map(dimensionCount)).toEqual([...scopes.map(dimensionCount)].sort((a, b) => a - b))
    expect(enumerateQualificationScopes([])).toEqual([{}])
  })
})
