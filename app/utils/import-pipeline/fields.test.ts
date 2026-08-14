import { describe, expect, it } from 'vitest'
import { hasRequiredColumnMappings, hasRequiredImportMappings, normalizeMappedEntry } from './fields'

describe('import field registry', () => {
  it('owns the required mapping policy, including plugin additions', () => {
    const requiredColumns = {
      seniority_number: 'seniority', employee_number: 'employee', seat: 'seat', base: 'base',
      fleet: 'fleet', hire_date: 'hire', retire_date: 'retire',
    }
    expect(hasRequiredColumnMappings(requiredColumns)).toBe(true)
    expect(hasRequiredColumnMappings(requiredColumns, { pluginRequired: ['name'] })).toBe(false)
    expect(hasRequiredImportMappings({
      ...Object.fromEntries(Object.entries(requiredColumns).map(([field, columnId]) => [field, { kind: 'column', columnId }])),
      name: { kind: 'column', columnId: 'name' },
    }, ['name'])).toBe(true)
  })

  it('owns shared conversion and final normalization', () => {
    expect(normalizeMappedEntry({
      seniority_number: ' 1 ', employee_number: '00123', name: 'Casey', seat: 'fo', base: 'bos', fleet: 'a220',
      hire_date: '1/2/75', retire_date: '1/2/62',
    })).toEqual({
      seniority_number: 1, employee_number: '123', name: 'Casey', seat: 'FO', base: 'BOS', fleet: 'A220',
      hire_date: '1975-01-02', retire_date: '2062-01-02',
    })
  })
})
