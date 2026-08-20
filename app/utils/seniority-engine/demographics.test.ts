// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'
import { computeAgeDistribution, computeQualComposition, computeYosDistribution, findMostJuniorCA } from './demographics'

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
