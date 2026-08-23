// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'
import type { GrowthAssumptions } from './growth'
import {
  calculateRetirementCountProjection,
  calculateSeniorityPercentile,
  calculateSeniorityRank,
  calculateSeniorityTrajectory,
  calculateSeniorityTrajectoryComparison,
  calculateTrajectoryChanges,
  countRetiredPilotsSeniorTo,
  generateAnnualSeniorityDates,
} from './math'

const date = (value: string) => parsePlainDate(value)
const asOfDate = date('2026-01-01')

describe('calculateSeniorityPercentile', () => {
  it('preserves the inverted seniority percentile formula', () => {
    expect([1, 2, 3, 4].map(rank => calculateSeniorityPercentile(rank, 4))).toEqual([100, 75, 50, 25])
    expect(calculateSeniorityPercentile(1, 0)).toBe(0)
  })
})

describe('calculateSeniorityRank', () => {
  it('calculates Rank from membership instead of Seniority Number distance', () => {
    const entries = [100, 105, 110, 125].map(seniorityNumber => makeEntry({ seniority_number: seniorityNumber }))

    expect(calculateSeniorityRank(entries, 100)).toBe(1)
    expect(calculateSeniorityRank(entries, 110)).toBe(3)
    expect(calculateSeniorityRank(entries, 125)).toBe(4)
  })
})

describe('countRetiredPilotsSeniorTo', () => {
  it('counts only senior pilots retired by the explicit As-of Date', () => {
    const entries = [
      makeEntry({ seniority_number: 100, retire_date: '2025-01-01' }),
      makeEntry({ seniority_number: 105, retire_date: '2025-06-01' }),
      makeEntry({ seniority_number: 110, retire_date: '2030-01-01' }),
      makeEntry({ seniority_number: 125, retire_date: '2024-01-01' }),
    ]

    expect(countRetiredPilotsSeniorTo(entries, 110, asOfDate)).toBe(2)
  })

  it('applies the supplied entry predicate', () => {
    const entries = [
      makeEntry({ seniority_number: 100, retire_date: '2025-01-01', base: 'JFK' }),
      makeEntry({ seniority_number: 105, retire_date: '2025-01-01', base: 'LAX' }),
    ]

    expect(countRetiredPilotsSeniorTo(entries, 125, asOfDate, entry => entry.base === 'JFK')).toBe(1)
  })

  it('does not count entries without retirement dates', () => {
    const entries = [
      makeEntry({ seniority_number: 100, retire_date: undefined }),
      makeEntry({ seniority_number: 105, retire_date: undefined }),
    ]

    expect(countRetiredPilotsSeniorTo(entries, 125, asOfDate)).toBe(0)
  })
})

describe('generateAnnualSeniorityDates', () => {
  it.each([
    {
      description: 'includes an anniversary equal to through',
      from: '2026-06-15',
      through: '2028-06-15',
      expected: ['2026-06-15', '2027-06-15', '2028-06-15'],
    },
    {
      description: 'does not append a partial-year sample between anniversaries',
      from: '2026-06-15',
      through: '2028-09-01',
      expected: ['2026-06-15', '2027-06-15', '2028-06-15'],
    },
    {
      description: 'returns no samples when through precedes from',
      from: '2026-06-15',
      through: '2026-06-14',
      expected: [],
    },
    {
      description: 'generates every whole-year sample across a long range',
      from: '2026-01-01',
      through: '2031-01-01',
      expected: ['2026-01-01', '2027-01-01', '2028-01-01', '2029-01-01', '2030-01-01', '2031-01-01'],
    },
  ])('$description', ({ from, through, expected }) => {
    expect(generateAnnualSeniorityDates(date(from), date(through)).map(value => value.toString())).toEqual(expected)
  })
})

describe('calculateSeniorityTrajectory', () => {
  it('returns dated Rank, percentile, and changes without presentation fields', () => {
    const entries = [
      makeEntry({ seniority_number: 100, retire_date: '2026-06-01' }),
      makeEntry({ seniority_number: 105, retire_date: '2027-06-01' }),
      makeEntry({ seniority_number: 110, retire_date: '2028-06-01' }),
      makeEntry({ seniority_number: 125, employee_number: '500', retire_date: '2040-01-01' }),
    ]

    const trajectory = calculateSeniorityTrajectory({
      entries,
      seniorityNumber: 125,
      from: date('2026-01-01'),
      through: date('2029-01-01'),
    })

    expect(trajectory.points).toEqual([
      { date: date('2026-01-01'), rank: 4, percentile: 25 },
      { date: date('2027-01-01'), rank: 3, percentile: 50 },
      { date: date('2028-01-01'), rank: 2, percentile: 75 },
      { date: date('2029-01-01'), rank: 1, percentile: 100 },
    ])
    expect(trajectory.changes).toEqual([
      { date: date('2027-01-01'), percentile: 50, percentilePointChange: 25 },
      { date: date('2028-01-01'), percentile: 75, percentilePointChange: 25 },
      { date: date('2029-01-01'), percentile: 100, percentilePointChange: 25 },
    ])
    expect(trajectory).not.toHaveProperty('chartData')
    expect(trajectory).not.toHaveProperty('labels')
    expect(trajectory.changes[0]).not.toHaveProperty('isPeak')
  })

  it('returns an empty domain result when through precedes from', () => {
    expect(calculateSeniorityTrajectory({
      entries: [makeEntry({ seniority_number: 100 })],
      seniorityNumber: 100,
      from: date('2026-01-02'),
      through: date('2026-01-01'),
    })).toEqual({ points: [], changes: [] })
  })

  it('applies Qualification Scope through an entry predicate', () => {
    const entries = [
      makeEntry({ seniority_number: 100, base: 'JFK', retire_date: '2026-06-01' }),
      makeEntry({ seniority_number: 105, base: 'LAX', retire_date: '2026-06-01' }),
      makeEntry({ seniority_number: 125, base: 'JFK', retire_date: '2040-01-01' }),
    ]

    const trajectory = calculateSeniorityTrajectory({
      entries,
      seniorityNumber: 125,
      from: date('2026-01-01'),
      through: date('2027-01-01'),
      predicate: entry => entry.base === 'JFK',
    })

    expect(trajectory.points).toEqual([
      { date: date('2026-01-01'), rank: 2, percentile: 50 },
      { date: date('2027-01-01'), rank: 1, percentile: 100 },
    ])
  })
})

describe('calculateSeniorityTrajectory with Growth Assumptions', () => {
  const enabledGrowth: GrowthAssumptions = { enabled: true, annualGrowthRate: 0.03 }
  const disabledGrowth: GrowthAssumptions = { enabled: false, annualGrowthRate: 0.03 }

  it('preserves the exact growth-adjusted percentile formula', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2028-06-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2035-06-01' }),
      makeEntry({ seniority_number: 3, retire_date: '2040-06-01' }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2045-01-01' }),
    ]

    const trajectory = calculateSeniorityTrajectory({
      entries,
      seniorityNumber: 5,
      from: date('2026-01-01'),
      through: date('2031-01-01'),
      growthAssumptions: enabledGrowth,
    })

    expect(trajectory.points[0]!.percentile).toBe(25)
    expect(trajectory.points.at(-1)!.percentile).toBe(60)
  })

  it('changes only the projected denominator and not Rank', () => {
    const entries = Array.from({ length: 9 }, (_, index) => makeEntry({
      seniority_number: index + 1,
      employee_number: String(index + 1),
      retire_date: index < 2 ? '2028-06-01' : '2045-01-01',
    }))
    entries.push(makeEntry({ seniority_number: 10, employee_number: '500', retire_date: '2050-01-01' }))
    const options = {
      entries,
      seniorityNumber: 10,
      from: date('2026-01-01'),
      through: date('2031-01-01'),
    }

    const withoutGrowth = calculateSeniorityTrajectory(options)
    const withGrowth = calculateSeniorityTrajectory({ ...options, growthAssumptions: enabledGrowth })
    const disabled = calculateSeniorityTrajectory({ ...options, growthAssumptions: disabledGrowth })

    expect(withGrowth.points.map(point => point.rank)).toEqual(withoutGrowth.points.map(point => point.rank))
    expect(withGrowth.points.at(-1)!.percentile).toBeGreaterThan(withoutGrowth.points.at(-1)!.percentile)
    expect(disabled).toEqual(withoutGrowth)
  })
})

describe('calculateSeniorityTrajectoryComparison', () => {
  it('returns dated domain points for baseline and comparison scopes', () => {
    const entries = [
      makeEntry({ seniority_number: 100, seat: 'CA', retire_date: '2027-01-01' }),
      makeEntry({ seniority_number: 105, seat: 'CA', retire_date: '2030-01-01' }),
      makeEntry({ seniority_number: 110, seat: 'FO', retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 125, seat: 'CA', retire_date: '2045-01-01' }),
    ]

    const comparison = calculateSeniorityTrajectoryComparison({
      entries,
      seniorityNumber: 125,
      from: date('2026-01-01'),
      through: date('2028-01-01'),
      baselinePredicate: entry => entry.seat === 'CA',
      comparisonPredicate: () => true,
    })

    expect(comparison.points).toEqual([
      { date: date('2026-01-01'), baselinePercentile: 33.3, comparisonPercentile: 25 },
      { date: date('2027-01-01'), baselinePercentile: 66.7, comparisonPercentile: 50 },
      { date: date('2028-01-01'), baselinePercentile: 66.7, comparisonPercentile: 50 },
    ])
    expect(comparison).not.toHaveProperty('labels')
    expect(comparison).not.toHaveProperty('baselineData')
    expect(comparison).not.toHaveProperty('comparisonData')
  })

  it('preserves the baseline Growth Assumptions for both compared scopes', () => {
    const entries = [100, 105, 110, 125].map(seniorityNumber => makeEntry({
      seniority_number: seniorityNumber,
      retire_date: '2045-01-01',
    }))

    const comparison = calculateSeniorityTrajectoryComparison({
      entries,
      seniorityNumber: 125,
      from: date('2026-01-01'),
      through: date('2031-01-01'),
      baselinePredicate: () => true,
      comparisonPredicate: () => true,
      growthAssumptions: { enabled: true, annualGrowthRate: 0.1 },
    })

    expect(comparison.points[0]).toMatchObject({ baselinePercentile: 25, comparisonPercentile: 25 })
    expect(comparison.points.at(-1)).toMatchObject({ baselinePercentile: 50, comparisonPercentile: 50 })
  })
})

describe('calculateRetirementCountProjection', () => {
  it('returns explicit dated count buckets without chart labels or arrays', () => {
    const entries = [
      makeEntry({ seniority_number: 100, base: 'JFK', retire_date: '2026-06-01' }),
      makeEntry({ seniority_number: 105, base: 'JFK', retire_date: '2027-01-01' }),
      makeEntry({ seniority_number: 110, base: 'JFK', retire_date: '2027-06-01' }),
      makeEntry({ seniority_number: 125, base: 'LAX', retire_date: '2027-06-01' }),
    ]

    const projection = calculateRetirementCountProjection({
      entries,
      from: date('2026-01-01'),
      through: date('2028-01-01'),
      predicate: entry => entry.base === 'JFK',
    })

    expect(projection).toEqual({
      buckets: [
        { through: date('2026-01-01'), retirementCount: 0 },
        { through: date('2027-01-01'), retirementCount: 2 },
        { through: date('2028-01-01'), retirementCount: 1 },
      ],
      scopedPilotCount: 3,
    })
    expect(projection).not.toHaveProperty('labels')
    expect(projection).not.toHaveProperty('data')
  })

  it('returns no buckets when through precedes from while preserving the scoped pilot count', () => {
    const projection = calculateRetirementCountProjection({
      entries: [makeEntry({ base: 'JFK' }), makeEntry({ base: 'LAX' })],
      from: date('2026-01-02'),
      through: date('2026-01-01'),
      predicate: entry => entry.base === 'JFK',
    })

    expect(projection).toEqual({ buckets: [], scopedPilotCount: 1 })
  })
})

describe('calculateTrajectoryChanges', () => {
  it('returns percentile-point changes without presentation peak state', () => {
    const changes = calculateTrajectoryChanges([
      { date: date('2026-01-01'), rank: 10, percentile: 20 },
      { date: date('2027-01-01'), rank: 8, percentile: 25 },
      { date: date('2028-01-01'), rank: 5, percentile: 35 },
      { date: date('2029-01-01'), rank: 3, percentile: 40 },
    ])

    expect(changes).toEqual([
      { date: date('2027-01-01'), percentile: 25, percentilePointChange: 5 },
      { date: date('2028-01-01'), percentile: 35, percentilePointChange: 10 },
      { date: date('2029-01-01'), percentile: 40, percentilePointChange: 5 },
    ])
    expect(changes.every(change => !('isPeak' in change))).toBe(true)
    expect(calculateTrajectoryChanges([])).toEqual([])
  })
})
