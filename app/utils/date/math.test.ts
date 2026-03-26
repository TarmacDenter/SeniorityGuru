// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { diffYears, deriveAge, computeYOS, computeRetireDate, isRetiredBy, extractYear, addYearsISO, retiresInYear, currentYear } from '.'

describe('diffYears', () => {
  it('computes fractional years between two ISO dates', () => {
    const result = diffYears('2020-01-01', '2025-01-01')
    expect(result).toBeCloseTo(5, 0)
  })
  it('handles same date as zero', () => {
    expect(diffYears('2020-06-15', '2020-06-15')).toBeCloseTo(0, 2)
  })
  it('handles partial year', () => {
    const result = diffYears('2020-01-01', '2020-07-01')
    expect(result).toBeGreaterThan(0.4)
    expect(result).toBeLessThan(0.6)
  })
})

describe('deriveAge', () => {
  it('back-calculates age from retirement date', () => {
    const tenYearsFromNow = new Date()
    tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10)
    const retireDate = tenYearsFromNow.toISOString().slice(0, 10)
    const age = deriveAge(retireDate, 65)
    expect(age).toBeCloseTo(55, 0)
  })
})

describe('computeYOS', () => {
  it('computes years of service', () => {
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
    const hireDate = fiveYearsAgo.toISOString().slice(0, 10)
    const yos = computeYOS(hireDate)
    expect(yos).toBeCloseTo(5, 0)
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

describe('isRetiredBy', () => {
  it('returns true when retire date is before as-of date', () => {
    expect(isRetiredBy('2025-01-01', '2026-01-01')).toBe(true)
  })
  it('returns true when retire date equals as-of date (boundary)', () => {
    expect(isRetiredBy('2026-06-15', '2026-06-15')).toBe(true)
  })
  it('returns false when retire date is after as-of date', () => {
    expect(isRetiredBy('2030-01-01', '2026-01-01')).toBe(false)
  })
})

describe('extractYear', () => {
  it('extracts year from ISO date', () => {
    expect(extractYear('2026-03-15')).toBe(2026)
  })
  it('extracts year from historic date', () => {
    expect(extractYear('1985-09-27')).toBe(1985)
  })
})

describe('addYearsISO', () => {
  it('adds years to an ISO date', () => {
    expect(addYearsISO('2026-01-01', 5)).toBe('2031-01-01')
  })
  it('adds zero years (identity)', () => {
    expect(addYearsISO('2026-06-15', 0)).toBe('2026-06-15')
  })
  it('handles leap day source (Feb 29 + 1 year)', () => {
    expect(addYearsISO('2024-02-29', 1)).toBe('2025-02-28')
  })
})

describe('retiresInYear', () => {
  it('returns true when retire date is in the given year', () => {
    expect(retiresInYear('2026-06-15', 2026)).toBe(true)
  })
  it('returns false when retire date is in a different year', () => {
    expect(retiresInYear('2026-06-15', 2025)).toBe(false)
  })
})

describe('currentYear', () => {
  it('returns the current four-digit year', () => {
    const year = currentYear()
    expect(year).toBeGreaterThanOrEqual(2026)
    expect(year).toBeLessThan(2100)
  })
})
