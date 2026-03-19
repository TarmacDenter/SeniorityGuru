// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { makeDomainEntry } from '#shared/test-utils/factories'
import {
  COMPANY_WIDE,
  qualSpecToFilter,
  qualSpecLabel,
  qualSpecEquals,
  enumerateQualSpecs,
} from './qual-spec'
import type { QualSpec } from './qual-spec'

const entries = [
  makeDomainEntry({ seniority_number: 1, employee_number: 'E1', base: 'ATL', seat: 'CA', fleet: '737' }),
  makeDomainEntry({ seniority_number: 2, employee_number: 'E2', base: 'ATL', seat: 'FO', fleet: '737' }),
  makeDomainEntry({ seniority_number: 3, employee_number: 'E3', base: 'JFK', seat: 'CA', fleet: '320' }),
  makeDomainEntry({ seniority_number: 4, employee_number: 'E4', base: 'JFK', seat: 'CA', fleet: '737' }),
  makeDomainEntry({ seniority_number: 5, employee_number: 'E5', base: 'ATL', seat: 'CA', fleet: '320' }),
]

describe('COMPANY_WIDE', () => {
  it('is an empty object', () => {
    expect(COMPANY_WIDE).toEqual({})
  })
})

describe('qualSpecToFilter', () => {
  it('empty spec passes all entries', () => {
    const filter = qualSpecToFilter({})
    expect(entries.every(filter)).toBe(true)
  })

  it('filters by fleet only', () => {
    const filter = qualSpecToFilter({ fleet: '737' })
    const result = entries.filter(filter)
    expect(result).toHaveLength(3) // E1, E2, E4
    expect(result.every(e => e.fleet === '737')).toBe(true)
  })

  it('filters by seat only', () => {
    const filter = qualSpecToFilter({ seat: 'FO' })
    const result = entries.filter(filter)
    expect(result).toHaveLength(1) // E2
    expect(result[0]!.employee_number).toBe('E2')
  })

  it('filters by base only', () => {
    const filter = qualSpecToFilter({ base: 'JFK' })
    const result = entries.filter(filter)
    expect(result).toHaveLength(2) // E3, E4
    expect(result.every(e => e.base === 'JFK')).toBe(true)
  })

  it('filters by two dimensions', () => {
    const filter = qualSpecToFilter({ seat: 'CA', base: 'ATL' })
    const result = entries.filter(filter)
    expect(result).toHaveLength(2) // E1, E5
    expect(result.every(e => e.seat === 'CA' && e.base === 'ATL')).toBe(true)
  })

  it('filters by all three dimensions', () => {
    const filter = qualSpecToFilter({ fleet: '737', seat: 'CA', base: 'JFK' })
    const result = entries.filter(filter)
    expect(result).toHaveLength(1) // E4
    expect(result[0]!.employee_number).toBe('E4')
  })
})

describe('qualSpecLabel', () => {
  it('empty spec returns "Company-wide"', () => {
    expect(qualSpecLabel({})).toBe('Company-wide')
  })

  it('fleet only', () => {
    expect(qualSpecLabel({ fleet: '737' })).toBe('737')
  })

  it('seat only', () => {
    expect(qualSpecLabel({ seat: 'CA' })).toBe('CA')
  })

  it('base only', () => {
    expect(qualSpecLabel({ base: 'ATL' })).toBe('ATL')
  })

  it('base + seat (base first)', () => {
    expect(qualSpecLabel({ seat: 'CA', base: 'ATL' })).toBe('ATL CA')
  })

  it('base + fleet (base first)', () => {
    expect(qualSpecLabel({ fleet: '737', base: 'JFK' })).toBe('JFK 737')
  })

  it('seat + fleet', () => {
    expect(qualSpecLabel({ fleet: '737', seat: 'CA' })).toBe('CA 737')
  })

  it('all three: base seat fleet', () => {
    expect(qualSpecLabel({ fleet: '737', seat: 'CA', base: 'ATL' })).toBe('ATL CA 737')
  })
})

describe('qualSpecEquals', () => {
  it('two empty specs are equal', () => {
    expect(qualSpecEquals({}, {})).toBe(true)
  })

  it('same single-dimension specs are equal', () => {
    expect(qualSpecEquals({ fleet: '737' }, { fleet: '737' })).toBe(true)
  })

  it('different specs are not equal', () => {
    expect(qualSpecEquals({ fleet: '737' }, { fleet: '320' })).toBe(false)
  })

  it('spec with field vs without is not equal', () => {
    expect(qualSpecEquals({ fleet: '737' }, {})).toBe(false)
  })

  it('treats undefined fields as absent', () => {
    const a: QualSpec = { fleet: '737', seat: undefined }
    const b: QualSpec = { fleet: '737' }
    expect(qualSpecEquals(a, b)).toBe(true)
  })

  it('full specs compare all fields', () => {
    const a: QualSpec = { fleet: '737', seat: 'CA', base: 'ATL' }
    const b: QualSpec = { fleet: '737', seat: 'CA', base: 'ATL' }
    expect(qualSpecEquals(a, b)).toBe(true)
  })

  it('full specs differ on one field', () => {
    const a: QualSpec = { fleet: '737', seat: 'CA', base: 'ATL' }
    const b: QualSpec = { fleet: '737', seat: 'CA', base: 'JFK' }
    expect(qualSpecEquals(a, b)).toBe(false)
  })
})

describe('enumerateQualSpecs', () => {
  it('prepends company-wide (empty spec)', () => {
    const specs = enumerateQualSpecs(entries)
    expect(specs[0]).toEqual({})
  })

  it('includes single-dimension specs for each unique value', () => {
    const specs = enumerateQualSpecs(entries)
    // Bases: ATL, JFK
    expect(specs).toContainEqual({ base: 'ATL' })
    expect(specs).toContainEqual({ base: 'JFK' })
    // Seats: CA, FO
    expect(specs).toContainEqual({ seat: 'CA' })
    expect(specs).toContainEqual({ seat: 'FO' })
    // Fleets: 320, 737
    expect(specs).toContainEqual({ fleet: '320' })
    expect(specs).toContainEqual({ fleet: '737' })
  })

  it('includes two-dimension combos that exist in data', () => {
    const specs = enumerateQualSpecs(entries)
    // ATL + CA exists (E1, E5)
    expect(specs).toContainEqual({ base: 'ATL', seat: 'CA' })
    // ATL + 737 exists (E1, E2)
    expect(specs).toContainEqual({ base: 'ATL', fleet: '737' })
    // CA + 737 exists (E1, E4)
    expect(specs).toContainEqual({ seat: 'CA', fleet: '737' })
  })

  it('does not include two-dimension combos that do not exist', () => {
    const specs = enumerateQualSpecs(entries)
    // JFK + FO does not exist in data
    expect(specs).not.toContainEqual({ base: 'JFK', seat: 'FO' })
  })

  it('includes three-dimension combos that exist in data', () => {
    const specs = enumerateQualSpecs(entries)
    expect(specs).toContainEqual({ base: 'ATL', seat: 'CA', fleet: '737' })
    expect(specs).toContainEqual({ base: 'JFK', seat: 'CA', fleet: '320' })
    expect(specs).toContainEqual({ base: 'JFK', seat: 'CA', fleet: '737' })
    expect(specs).toContainEqual({ base: 'ATL', seat: 'FO', fleet: '737' })
    expect(specs).toContainEqual({ base: 'ATL', seat: 'CA', fleet: '320' })
  })

  it('has no duplicate specs', () => {
    const specs = enumerateQualSpecs(entries)
    const labels = specs.map(qualSpecLabel)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('sorts: company-wide first, then by dimension count, then alphabetically', () => {
    const specs = enumerateQualSpecs(entries)
    const labels = specs.map(qualSpecLabel)

    // First is always Company-wide
    expect(labels[0]).toBe('Company-wide')

    // Group by dimension count
    const dimCount = (s: QualSpec) =>
      (s.base ? 1 : 0) + (s.seat ? 1 : 0) + (s.fleet ? 1 : 0)

    for (let i = 1; i < specs.length; i++) {
      const prevDims = dimCount(specs[i - 1]!)
      const currDims = dimCount(specs[i]!)
      if (prevDims === currDims) {
        // Same dimension count: alphabetical by label
        expect(labels[i - 1]! <= labels[i]!).toBe(true)
      } else {
        // Dimension count should only increase
        expect(currDims).toBeGreaterThanOrEqual(prevDims)
      }
    }
  })

  it('returns only company-wide for empty entries', () => {
    expect(enumerateQualSpecs([])).toEqual([{}])
  })
})
