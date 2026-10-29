// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { Temporal } from '~/utils/temporal'
import { createSeniorityAnalysis } from './seniority'

const asOfDate = Temporal.PlainDate.from('2026-06-15')
const entries = [
  makeEntry({ seniority_number: 100, employee_number: '100', hire_date: '2016-06-15', retire_date: '2030-06-15' }),
  makeEntry({ seniority_number: 200, employee_number: '200', hire_date: '2016-06-15', retire_date: undefined }),
  makeEntry({ seniority_number: 900, employee_number: '900', hire_date: '2016-06-15', retire_date: '2025-06-15' }),
  makeEntry({ seniority_number: 400, employee_number: '400', hire_date: '2016-06-15', retire_date: '2026-06-15' }),
  makeEntry({ seniority_number: 500, employee_number: '500', hire_date: '2016-06-15', base: 'LAX', retire_date: '2035-06-15' }),
  makeEntry({ seniority_number: 600, employee_number: '600', hire_date: '2016-06-15', base: 'ATL', fleet: '787', retire_date: '2020-06-15' }),
  makeEntry({ seniority_number: 700, employee_number: '700', hire_date: '2016-06-15', seat: 'FO', retire_date: '2040-06-15' }),
  makeEntry({ seniority_number: 800, employee_number: '800', hire_date: '2016-06-15', fleet: '787', retire_date: '2045-06-15' }),
]

const options = { mandatoryRetirementAge: 65 }

describe('public demographic Qualification Thresholds', () => {
  it('selects the most junior active captain in each Qualification without an Anchor Pilot', () => {
    const output = createSeniorityAnalysis({ entries, asOfDate }).demographics(options)

    expect(output.domain.captainQualificationThresholds.map(row => ({
      qualification: row.qualification,
      seniorityNumber: row.seniorityNumber,
    }))).toEqual([
      { qualification: { base: 'JFK', seat: 'CA', fleet: '737' }, seniorityNumber: 200 },
      { qualification: { base: 'LAX', seat: 'CA', fleet: '737' }, seniorityNumber: 500 },
      { qualification: { base: 'JFK', seat: 'CA', fleet: '787' }, seniorityNumber: 800 },
    ])
    expect(output.presentation.captainQualificationThresholds.map(row => row.seniorityNumber)).toEqual([200, 500, 800])
  })


  for (const anchored of [false, true]) {
    describe(anchored ? 'with an Anchor Pilot' : 'without an Anchor Pilot', () => {
      const analyze = (date = asOfDate) => {
        const organization = createSeniorityAnalysis({ entries, asOfDate: date })
        return anchored ? organization.withAnchor('200') : organization
      }

      it('uses the bound As-of Date and treats retirement on that date as inactive', () => {
        const before = analyze(asOfDate.subtract({ days: 1 })).demographics(options)
        const onDate = analyze().demographics(options)

        expect(before.domain.captainQualificationThresholds[0]?.seniorityNumber).toBe(400)
        expect(onDate.domain.captainQualificationThresholds[0]?.seniorityNumber).toBe(200)
      })

      it('respects Base, Seat, and Fleet constraints in the Qualification Scope', () => {
        const output = analyze().demographics({
          ...options,
          scenario: { qualificationScope: { base: 'JFK', seat: 'CA', fleet: '737' } },
        })

        expect(output.domain.captainQualificationThresholds).toHaveLength(1)
        expect(output.domain.captainQualificationThresholds[0]).toMatchObject({
          qualification: { base: 'JFK', seat: 'CA', fleet: '737' },
          seniorityNumber: 200,
          hireDate: Temporal.PlainDate.from('2016-06-15'),
          yearsOfService: 10,
        })
        expect(output.presentation.captainQualificationThresholds).toMatchObject([
          { qualificationLabel: '737 CA JFK', seniorityNumber: 200, yos: 10 },
        ])
      })

      it.each([
        { base: 'ATL', seat: 'CA', fleet: '787' },
        { base: 'JFK', seat: 'FO', fleet: '737' },
      ])('returns no threshold when the scope has no active captains: %j', (qualificationScope) => {
        const output = analyze().demographics({ ...options, scenario: { qualificationScope } })

        expect(output.domain.captainQualificationThresholds).toEqual([])
        expect(output.presentation.captainQualificationThresholds).toEqual([])
      })

      it('preserves all scoped pilots in age, years of service, and Qualification Composition', () => {
        const output = analyze().demographics(options)

        expect(output.domain.ageDistribution.unknownAgePilotCount).toBe(1)
        expect(output.domain.ageDistribution.buckets.map(bucket => [bucket.minimumAge, bucket.pilotCount])).toEqual([
          [0, 0], [30, 0], [35, 0], [40, 0], [45, 1], [50, 1], [55, 1], [60, 1], [65, 3],
        ])
        expect(output.domain.yearsOfServiceDistribution).toEqual({
          entryFloor: 10, p10: 10, p25: 10, median: 10, p75: 10, p90: 10, maximum: 10,
        })
        expect(output.domain.yearsOfServiceBuckets.find(bucket => bucket.minimumYears === 10)).toEqual({
          minimumYears: 10, maximumYears: 11, pilotCount: 8,
        })
        expect(output.domain.yearsOfServiceBuckets.reduce((total, bucket) => total + bucket.pilotCount, 0)).toBe(8)
        expect(output.domain.qualificationComposition.map(row => ({
          fleet: row.fleet, seat: row.seat, pilotCount: row.pilotCount,
        }))).toEqual([
          { fleet: '737', seat: 'CA', pilotCount: 5 },
          { fleet: '787', seat: 'CA', pilotCount: 2 },
          { fleet: '737', seat: 'FO', pilotCount: 1 },
        ])
        expect(output.presentation.ageDistribution.nullCount).toBe(1)
        expect(output.presentation.qualificationComposition.map(row => row.total)).toEqual([5, 2, 1])

        const retiredScope = analyze().demographics({
          ...options,
          scenario: { qualificationScope: { base: 'ATL', seat: 'CA', fleet: '787' } },
        }).domain
        expect(retiredScope.ageDistribution.buckets.at(-1)?.pilotCount).toBe(1)
        expect(retiredScope.yearsOfServiceBuckets.find(bucket => bucket.minimumYears === 10)?.pilotCount).toBe(1)
        expect(retiredScope.qualificationComposition[0]?.pilotCount).toBe(1)
      })
    })
  }

  it('keeps anchored captain thresholds consistent with active Qualification Positions and their personal overlay', () => {
    const anchored = createSeniorityAnalysis({ entries, asOfDate }).withAnchor('200')
    const output = anchored.demographics(options)
    const positions = anchored.qualificationPositions({ through: asOfDate }).domain

    expect(anchored.seniorityStanding().domain.activePilotCount).toBe(5)
    expect(output.domain.captainQualificationThresholds.map(row => row.seniorityNumber)).toEqual([200, 500, 800])
    for (const threshold of output.domain.captainQualificationThresholds) {
      const position = positions.find(row =>
        row.distribution.qualification.base === threshold.qualification.base
        && row.distribution.qualification.seat === threshold.qualification.seat
        && row.distribution.qualification.fleet === threshold.qualification.fleet,
      )
      expect(position?.distribution.thresholdSeniorityNumber).toBe(threshold.seniorityNumber)
      expect(output.presentation.captainQualificationThresholds.find(row => row.seniorityNumber === threshold.seniorityNumber)?.modeledHoldable)
        .toBe(position?.modeledHoldable)
    }
  })
})
