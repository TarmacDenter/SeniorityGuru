// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'
import {
  analyzeAgeDistribution,
  analyzeQualificationComposition,
  analyzeYearsOfServiceBuckets,
  analyzeYearsOfServiceDistribution,
  findCaptainQualificationThresholds,
} from './demographics'

const asOfDate = parsePlainDate('2026-01-01')

describe('demographic domain analysis', () => {
  it('returns numeric age bounds and a separate unknown-age pilot count', () => {
    const result = analyzeAgeDistribution([
      makeEntry({ fleet: '737', retire_date: '2030-01-01' }),
      makeEntry({ fleet: '787', retire_date: '2040-01-01' }),
      makeEntry({ fleet: '737', retire_date: undefined }),
    ], 65, entry => entry.fleet === '737', asOfDate)

    expect(result.buckets.find(bucket => bucket.minimumAge === 60)).toEqual({
      minimumAge: 60,
      maximumAge: 64,
      pilotCount: 1,
    })
    expect(result.buckets.at(-1)).toEqual({ minimumAge: 65, pilotCount: 0 })
    expect(result.unknownAgePilotCount).toBe(1)
    expect(result.buckets.every(bucket => !('label' in bucket))).toBe(true)
  })

  it('returns the least-senior captain threshold for every Qualification', () => {
    const result = findCaptainQualificationThresholds([
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 100 }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 500 }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'LAX', seniority_number: 300 }),
      makeEntry({ fleet: '737', seat: 'FO', base: 'JFK', seniority_number: 600 }),
    ], asOfDate)

    expect(result).toHaveLength(2)
    expect(result.find(row => row.qualification.base === 'JFK')?.seniorityNumber).toBe(500)
    expect(result.find(row => row.qualification.base === 'LAX')?.seniorityNumber).toBe(300)
    expect(result.every(row => row.qualification.seat === 'CA')).toBe(true)
  })

  it('returns no captain thresholds when the scope has no captains', () => {
    expect(findCaptainQualificationThresholds([makeEntry({ seat: 'FO' })], asOfDate)).toEqual([])
  })

  it('preserves Years of Service distribution values with explicit names', () => {
    const result = analyzeYearsOfServiceDistribution([
      makeEntry({ seniority_number: 100, hire_date: '2000-01-01' }),
      makeEntry({ seniority_number: 105, hire_date: '2010-01-01' }),
      makeEntry({ seniority_number: 125, hire_date: '2020-01-01' }),
    ], undefined, asOfDate)

    expect(result.entryFloor).toBe(6)
    expect(result.median).toBe(16)
    expect(result.maximum).toBe(26)
    expect(result).not.toHaveProperty('max')
  })

  it('returns zero distribution values and no buckets for an empty scope', () => {
    expect(analyzeYearsOfServiceDistribution([], undefined, asOfDate)).toEqual({
      entryFloor: 0,
      p10: 0,
      p25: 0,
      median: 0,
      p75: 0,
      p90: 0,
      maximum: 0,
    })
    expect(analyzeYearsOfServiceBuckets([], undefined, asOfDate)).toEqual([])
  })

  it('returns Years of Service buckets with numeric bounds and pilot counts', () => {
    const buckets = analyzeYearsOfServiceBuckets([
      makeEntry({ hire_date: '2020-01-01', fleet: '737' }),
      makeEntry({ hire_date: '2010-01-01', fleet: '787' }),
    ], entry => entry.fleet === '737', asOfDate)

    expect(buckets.reduce((total, bucket) => total + bucket.pilotCount, 0)).toBe(1)
    expect(buckets[6]).toEqual({ minimumYears: 6, maximumYears: 7, pilotCount: 1 })
    expect(buckets[6]).not.toHaveProperty('label')
  })

  it('preserves Qualification composition counts and base percentages', () => {
    const result = analyzeQualificationComposition([
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'LAX' }),
      makeEntry({ fleet: '737', seat: 'FO', base: 'JFK' }),
    ])
    const captains = result.find(row => row.fleet === '737' && row.seat === 'CA')!

    expect(captains).toMatchObject({ pilotCount: 2, captainCount: 2, firstOfficerCount: 0 })
    expect(captains.byBase.reduce((total, base) => total + base.percentage, 0)).toBe(100)
  })
})
