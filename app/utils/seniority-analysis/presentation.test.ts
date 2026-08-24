// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parsePlainDate } from '~/utils/temporal'
import type {
  PercentileCrossingResult,
  QualificationPosition,
  SeniorityDemographics,
} from '~/utils/seniority-engine/types'
import {
  formatQualification,
  formatQualificationScope,
  formatSeniorityCount,
  formatSeniorityRankChange,
  presentAnchoredSeniorityDemographics,
  presentAgeBucket,
  presentPercentileCrossing,
  presentQualificationPositions,
  presentRetirementCountProjection,
  presentSeniorityDemographics,
  presentSeniorityTrajectory,
  presentSeniorityTrajectoryComparison,
} from './presentation'
import type {
  RetirementCountProjection,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
} from './math'

const date = (value: string) => parsePlainDate(value)

describe('seniority presentation', () => {
  it('maps a completed trajectory to chart series and presentation-only peak highlights', () => {
    const trajectory: SeniorityTrajectory = {
      points: [
        { date: date('2026-01-01'), rank: 9, percentile: 10 },
        { date: date('2027-01-01'), rank: 8, percentile: 12 },
        { date: date('2028-01-01'), rank: 6, percentile: 19 },
        { date: date('2029-01-01'), rank: 5, percentile: 22 },
      ],
      changes: [
        { date: date('2027-01-01'), percentile: 12, percentilePointChange: 2 },
        { date: date('2028-01-01'), percentile: 19, percentilePointChange: 7 },
        { date: date('2029-01-01'), percentile: 22, percentilePointChange: 3 },
      ],
    }

    expect(presentSeniorityTrajectory(trajectory)).toEqual({
      chartData: {
        labels: ['2026-01-01', '2027-01-01', '2028-01-01', '2029-01-01'],
        data: [10, 12, 19, 22],
      },
      changes: [
        { date: date('2027-01-01'), percentile: 12, percentilePointChange: 2, isPeak: false },
        { date: date('2028-01-01'), percentile: 19, percentilePointChange: 7, isPeak: true },
        { date: date('2029-01-01'), percentile: 22, percentilePointChange: 3, isPeak: false },
      ],
    })
  })

  it('maps a constructed comparison without recalculating either series', () => {
    const comparison: SeniorityTrajectoryComparison = {
      points: [
        { date: date('2026-03-15'), baselinePercentile: 17.2, comparisonPercentile: 88.4 },
        { date: date('2027-03-15'), baselinePercentile: 91.1, comparisonPercentile: 6.3 },
      ],
    }

    expect(presentSeniorityTrajectoryComparison(comparison)).toEqual({
      labels: ['2026-03-15', '2027-03-15'],
      baselineData: [17.2, 91.1],
      comparisonData: [88.4, 6.3],
    })
  })

  it('maps constructed retirement buckets to display labels and counts', () => {
    const projection: RetirementCountProjection = {
      buckets: [
        { through: date('2026-06-15'), retirementCount: 7 },
        { through: date('2027-06-15'), retirementCount: 2 },
      ],
      scopedPilotCount: 41,
    }

    expect(presentRetirementCountProjection(projection)).toEqual({
      labels: ['Jun 2026', 'Jun 2027'],
      data: [7, 2],
      scopedPilotCount: 41,
    })
  })

  it('formats Qualifications, Qualification Scope, counts, and Rank changes', () => {
    expect(formatQualification({ base: 'JFK', seat: 'CA', fleet: '737' })).toBe('CA/737/JFK')
    expect(formatQualificationScope({})).toBe('Company-wide')
    expect(formatQualificationScope({ base: 'JFK', seat: 'CA' })).toBe('JFK CA')
    expect(formatSeniorityCount(1234)).toMatch(/1.234|1,234|1\s234/)
    expect(formatSeniorityRankChange(0)).toBe('--')
    expect(formatSeniorityRankChange(12)).toBe('+12')
    expect(formatSeniorityRankChange(-3)).toBe('-3')
  })

  it('formats percentile crossing years without owning crossing analysis', () => {
    const crossing: PercentileCrossingResult = { crossingYear: 2034 }

    expect(presentPercentileCrossing(crossing)).toEqual({ year: '2034' })
    expect(presentPercentileCrossing(null)).toBeNull()
  })

  it('derives age range labels from numeric domain bounds', () => {
    expect(presentAgeBucket({ minimumAge: 0, maximumAge: 24, pilotCount: 3 })).toEqual({ label: '< 25', count: 3 })
    expect(presentAgeBucket({ minimumAge: 25, maximumAge: 34, pilotCount: 5 })).toEqual({ label: '25–34', count: 5 })
    expect(presentAgeBucket({ minimumAge: 65, pilotCount: 2 })).toEqual({ label: '65+', count: 2 })
  })

  it('adapts constructed demographic domain values without changing their calculations', () => {
    const demographics: SeniorityDemographics = {
      ageDistribution: {
        buckets: [{ minimumAge: 50, maximumAge: 54, pilotCount: 2 }],
        unknownAgePilotCount: 1,
      },
      yearsOfServiceDistribution: {
        entryFloor: 3,
        p10: 4,
        p25: 6,
        median: 9,
        p75: 14,
        p90: 18,
        maximum: 24,
      },
      yearsOfServiceBuckets: [{ minimumYears: 5, maximumYears: 9, pilotCount: 7 }],
      qualificationComposition: [{
        fleet: '737',
        seat: 'CA',
        pilotCount: 10,
        captainCount: 10,
        firstOfficerCount: 0,
        captainToFirstOfficerRatio: 10,
        byBase: [{ base: 'JFK', pilotCount: 6, percentage: 60 }],
      }],
      captainQualificationThresholds: [{
        qualification: { base: 'JFK', seat: 'CA', fleet: '737' },
        seniorityNumber: 125,
        hireDate: date('2012-04-05'),
        yearsOfService: 13.75,
      }],
    }

    expect(presentSeniorityDemographics(demographics)).toEqual({
      ageDistribution: {
        buckets: [{ label: '50–54', count: 2 }],
        nullCount: 1,
      },
      yearsOfServiceDistribution: {
        entryFloor: 3,
        p10: 4,
        p25: 6,
        median: 9,
        p75: 14,
        p90: 18,
        max: 24,
      },
      yearsOfServiceBuckets: [{ label: '5', minYos: 5, count: 7 }],
      qualificationComposition: [{
        qualificationLabel: '737 CA',
        fleet: '737',
        seat: 'CA',
        total: 10,
        caCount: 10,
        foCount: 0,
        caFoRatio: 10,
        byBase: [{ base: 'JFK', count: 6, pct: 60 }],
      }],
      captainQualificationThresholds: [{
        qualificationLabel: '737 CA JFK',
        fleet: '737',
        seat: 'CA',
        base: 'JFK',
        seniorityNumber: 125,
        hireDate: date('2012-04-05'),
        yos: 13.75,
        modeledHoldable: false,
      }],
    })
  })

  it('flattens constructed Qualification Positions for existing components', () => {
    const positions: QualificationPosition[] = [{
      distribution: {
        qualification: { base: 'JFK', seat: 'CA', fleet: '737' },
        activePilotCount: 12,
        thresholdPercentile: 36,
        thresholdSeniorityNumber: 105,
        percentile25: 25,
        medianPercentile: 50,
        percentile75: 75,
        maximumPercentile: 98,
        percentileDensity: [{ minimumPercentile: 10, maximumPercentile: 15, pilotCount: 4 }],
      },
      currentPercentile: 42,
      projectedPercentile: 61,
      modeledHoldable: true,
    }]

    expect(presentQualificationPositions(positions)).toEqual([{
      qualification: { base: 'JFK', seat: 'CA', fleet: '737' },
      activePilotCount: 12,
      thresholdPercentile: 36,
      thresholdSeniorityNumber: 105,
      percentile25: 25,
      medianPercentile: 50,
      percentile75: 75,
      maximumPercentile: 98,
      percentileDensity: [{ minimumPercentile: 10, maximumPercentile: 15, pilotCount: 4 }],
      currentPercentile: 42,
      projectedPercentile: 61,
      modeledHoldable: true,
    }])
  })

  it('joins modeled Holdable state into a completed anchored demographics presentation', () => {
    const demographics: SeniorityDemographics = {
      ageDistribution: { buckets: [], unknownAgePilotCount: 0 },
      yearsOfServiceDistribution: { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, maximum: 0 },
      yearsOfServiceBuckets: [],
      qualificationComposition: [],
      captainQualificationThresholds: [{
        qualification: { base: 'JFK', seat: 'CA', fleet: '737' },
        seniorityNumber: 125,
        hireDate: date('2012-04-05'),
        yearsOfService: 13.75,
      }],
    }
    const positions: QualificationPosition[] = [{
      distribution: {
        qualification: { base: 'JFK', seat: 'CA', fleet: '737' },
        activePilotCount: 12,
        thresholdPercentile: 36,
        thresholdSeniorityNumber: 125,
        percentile25: 25,
        medianPercentile: 50,
        percentile75: 75,
        maximumPercentile: 98,
        percentileDensity: [],
      },
      currentPercentile: 42,
      projectedPercentile: 61,
      modeledHoldable: true,
    }]

    expect(presentAnchoredSeniorityDemographics(demographics, positions)
      .captainQualificationThresholds[0]?.modeledHoldable).toBe(true)
  })
})
