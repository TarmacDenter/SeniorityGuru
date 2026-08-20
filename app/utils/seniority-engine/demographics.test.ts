// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry, makeEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'
import {
  computeAgeDistribution,
  computeQualComposition,
  computeYosDistribution,
  computeYosHistogram,
  findMostJuniorCA,
  qualKey,
} from './demographics'

const asOfDate = parsePlainDate('2026-01-01')

describe('demographics', () => {
  it('returns scoped demographic and qualification results', () => {
    const entries = [
      makeDomainEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 10, hire_date: '2000-01-01', retire_date: '2030-01-01' }),
      makeDomainEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 20, hire_date: '2010-01-01', retire_date: '2040-01-01' }),
      makeDomainEntry({ fleet: '320', seat: 'FO', base: 'ATL', seniority_number: 30, hire_date: '2020-01-01', retire_date: '2050-01-01' }),
    ]
    expect(computeAgeDistribution(entries, 65, entry => entry.fleet === '737', asOfDate).buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(2)
    expect(computeQualComposition(entries).find(row => row.qualKey === '737 CA')?.total).toBe(2)
    expect(findMostJuniorCA(entries, asOfDate)[0]?.seniorityNumber).toBe(20)
    expect(computeYosDistribution(entries, entry => entry.fleet === '737', asOfDate).median).toBeGreaterThan(10)
  })
})

describe('qualKey', () => {
  it('uses the fleet and seat', () => {
    expect(qualKey(makeEntry({ fleet: '320', seat: 'FO' }))).toBe('320 FO')
  })
})

describe('computeAgeDistribution', () => {
  it('groups dated retirements, applies scope, and counts missing dates', () => {
    const entries = [
      makeEntry({ fleet: '737', retire_date: '2030-01-01' }),
      makeEntry({ fleet: '787', retire_date: '2040-01-01' }),
      makeEntry({ fleet: '737', retire_date: null }),
    ]
    const result = computeAgeDistribution(entries, 65, entry => entry.fleet === '737', asOfDate)
    expect(result.buckets.find(bucket => bucket.label === '60–64')?.count).toBe(1)
    expect(result.nullCount).toBe(1)
  })
})

describe('findMostJuniorCA', () => {
  it('returns the least senior captain for every fleet, seat, and base', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 100 }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 500 }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'LAX', seniority_number: 300 }),
      makeEntry({ fleet: '737', seat: 'FO', base: 'JFK', seniority_number: 600 }),
    ]
    const result = findMostJuniorCA(entries, asOfDate)
    expect(result).toHaveLength(2)
    expect(result.find(row => row.base === 'JFK')?.seniorityNumber).toBe(500)
    expect(result.find(row => row.base === 'LAX')?.seniorityNumber).toBe(300)
  })

  it('returns no rows when there are no captains', () => {
    expect(findMostJuniorCA([makeEntry({ seat: 'FO' })], asOfDate)).toEqual([])
  })
})

describe('computeYosDistribution', () => {
  it('returns zeros for an empty scoped result', () => {
    expect(computeYosDistribution([], undefined, asOfDate)).toEqual({
      entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0,
    })
  })

  it('uses the most junior entry for the floor and the median sorted YOS value', () => {
    const entries = [
      makeEntry({ seniority_number: 1, hire_date: '2000-01-01' }),
      makeEntry({ seniority_number: 2, hire_date: '2010-01-01' }),
      makeEntry({ seniority_number: 10, hire_date: '2020-01-01' }),
    ]
    const result = computeYosDistribution(entries, undefined, asOfDate)
    expect(result.entryFloor).toBeLessThan(10)
    expect(result.median).toBeGreaterThan(14)
    expect(result.median).toBeLessThan(18)
  })
})

describe('computeYosHistogram', () => {
  it('handles empty inputs and places each pilot in one YOS bucket', () => {
    expect(computeYosHistogram([], undefined, asOfDate)).toEqual([])
    const histogram = computeYosHistogram([
      makeEntry({ hire_date: '2020-01-01', fleet: '737' }),
      makeEntry({ hire_date: '2010-01-01', fleet: '787' }),
    ], entry => entry.fleet === '737', asOfDate)
    expect(histogram.reduce((total, bucket) => total + bucket.count, 0)).toBe(1)
  })
})

describe('computeQualComposition', () => {
  it('groups fleet and seat counts and reports base percentages', () => {
    const result = computeQualComposition([
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'LAX' }),
      makeEntry({ fleet: '737', seat: 'FO', base: 'JFK' }),
    ])
    const captains = result.find(row => row.qualKey === '737 CA')!
    expect(captains).toMatchObject({ total: 2, caCount: 2, foCount: 0 })
    expect(captains.byBase.reduce((total, base) => total + base.pct, 0)).toBeCloseTo(100, 0)
  })
})
