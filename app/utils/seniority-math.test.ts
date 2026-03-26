// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { countRetiredAbove, generateTimePoints, buildTrajectory, computeRank, getProjectionEndDate, formatNumber, projectRetirements, projectComparativeTrajectory, computeTrajectoryDeltas } from './seniority-math'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import type { GrowthConfig } from '~/utils/growth-config'
import { todayISO, extractYear } from '~/utils/date'

describe('countRetiredAbove', () => {
  it('returns 0 when no entries have retired', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2041-01-01' }),
    ]
    const result = countRetiredAbove(entries, 3, '2026-06-01')
    expect(result).toBe(0)
  })

  it('counts only entries with seniority_number < userSenNum AND retire_date <= asOfDate', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2025-01-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2025-06-01' }),
      makeEntry({ seniority_number: 3, retire_date: '2025-01-01' }),
      makeEntry({ seniority_number: 4, retire_date: '2024-01-01' }),
      makeEntry({ seniority_number: 1, retire_date: '2030-01-01' }),
    ]
    const result = countRetiredAbove(entries, 3, '2026-01-01')
    expect(result).toBe(2)
  })

  it('respects filterFn', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2025-01-01', base: 'JFK' }),
      makeEntry({ seniority_number: 2, retire_date: '2025-01-01', base: 'LAX' }),
    ]
    const result = countRetiredAbove(entries, 5, '2026-01-01', (e) => e.base === 'JFK')
    expect(result).toBe(1)
  })

  it('handles null retire_date (should NOT count as retired)', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: undefined }),
      makeEntry({ seniority_number: 2, retire_date: undefined }),
    ]
    const result = countRetiredAbove(entries, 5, '2026-01-01')
    expect(result).toBe(0)
  })
})

describe('generateTimePoints', () => {
  it('generates yearly points as ISO strings', () => {
    const points = generateTimePoints('2026-01-01', '2031-01-01')
    expect(points.length).toBe(6)
    expect(points[0]).toBe('2026-01-01')
    expect(points[1]).toBe('2027-01-01')
    for (const p of points) {
      expect(p <= '2031-01-01').toBe(true)
    }
  })

  it('generates correct number of points for long range', () => {
    const points = generateTimePoints('2026-01-01', '2040-01-01')
    expect(points.length).toBe(15)
    expect(points[points.length - 1]).toBe('2040-01-01')
  })

  it('stops at or before endDate', () => {
    const points = generateTimePoints('2026-01-01', '2038-06-15')
    for (const p of points) {
      expect(p <= '2038-06-15').toBe(true)
    }
  })

  it('handles short range', () => {
    const points = generateTimePoints('2026-01-01', '2027-06-01')
    expect(points.length).toBe(2)
    for (const p of points) {
      expect(p <= '2027-06-01').toBe(true)
    }
  })
})

describe('buildTrajectory', () => {
  it('returns decreasing rank over time as retirements accumulate', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2026-06-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2027-06-01' }),
      makeEntry({ seniority_number: 3, retire_date: '2028-06-01' }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
    ]
    const timePoints = ['2026-01-01', '2026-12-01', '2027-12-01', '2028-12-01']
    const trajectory = buildTrajectory(entries, 5, timePoints)
    expect(trajectory).toEqual([
      { date: '2026-01-01', rank: 4, percentile: 25 },
      { date: '2026-12-01', rank: 3, percentile: 50 },
      { date: '2027-12-01', rank: 2, percentile: 75 },
      { date: '2028-12-01', rank: 1, percentile: 100 },
    ])
  })

  it('returns empty array when no time points', () => {
    const entries = [makeEntry({ seniority_number: 1 })]
    const trajectory = buildTrajectory(entries, 5, [])
    expect(trajectory).toEqual([])
  })

  it('handles entries with no retire_date', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: undefined }),
      makeEntry({ seniority_number: 2, retire_date: undefined }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
    ]
    const timePoints = ['2030-01-01', '2035-01-01']
    const trajectory = buildTrajectory(entries, 5, timePoints)
    expect(trajectory).toEqual([
      { date: '2030-01-01', rank: 3, percentile: 33.3 },
      { date: '2035-01-01', rank: 3, percentile: 33.3 },
    ])
  })
})

describe('buildTrajectory with growthConfig', () => {
  const growthEnabled: GrowthConfig = { enabled: true, annualRate: 0.03 }
  const growthDisabled: GrowthConfig = { enabled: false, annualRate: 0.03 }

  it('growth produces higher percentile than no growth', () => {
    const entries = Array.from({ length: 9 }, (_, i) => makeEntry({
      seniority_number: i + 1,
      employee_number: String(i + 1),
      retire_date: i < 2 ? '2028-06-01' : '2045-01-01',
    }))
    entries.push(makeEntry({ seniority_number: 10, employee_number: '500', retire_date: '2050-01-01' }))

    const timePoints = ['2026-01-01', '2031-01-01']
    const withoutGrowth = buildTrajectory(entries, 10, timePoints)
    const withGrowth = buildTrajectory(entries, 10, timePoints, undefined, growthEnabled)

    expect(withGrowth[0]!.percentile).toBe(withoutGrowth[0]!.percentile)
    expect(withGrowth[1]!.percentile).toBeGreaterThan(withoutGrowth[1]!.percentile)
  })

  it('disabled growth config matches no-config behavior', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2028-06-01' }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
    ]
    const timePoints = ['2026-01-01', '2031-01-01']
    const noConfig = buildTrajectory(entries, 5, timePoints)
    const disabled = buildTrajectory(entries, 5, timePoints, undefined, growthDisabled)
    expect(disabled).toEqual(noConfig)
  })

  it('computes exact growth-adjusted percentile', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2028-06-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2035-06-01' }),
      makeEntry({ seniority_number: 3, retire_date: '2040-06-01' }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2045-01-01' }),
    ]
    const timePoints = ['2026-01-01', '2031-01-01']
    const result = buildTrajectory(entries, 5, timePoints, undefined, growthEnabled)
    expect(result[0]!.percentile).toBe(25)
    expect(result[1]!.percentile).toBe(60)
  })

  it('rank is unchanged by growth (only denominator changes)', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2028-06-01' }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
    ]
    const timePoints = ['2026-01-01', '2031-01-01']
    const withGrowth = buildTrajectory(entries, 5, timePoints, undefined, growthEnabled)
    const withoutGrowth = buildTrajectory(entries, 5, timePoints)
    expect(withGrowth[0]!.rank).toBe(withoutGrowth[0]!.rank)
    expect(withGrowth[1]!.rank).toBe(withoutGrowth[1]!.rank)
  })
})

describe('computeRank', () => {
  it('returns 1 when user is most senior', () => {
    const entries = [
      makeEntry({ seniority_number: 5 }),
      makeEntry({ seniority_number: 10 }),
    ]
    expect(computeRank(entries, 5)).toBe(1)
  })

  it('returns correct rank when entries are ahead', () => {
    const entries = [
      makeEntry({ seniority_number: 1 }),
      makeEntry({ seniority_number: 2 }),
      makeEntry({ seniority_number: 5 }),
    ]
    expect(computeRank(entries, 5)).toBe(3)
  })
})

describe('getProjectionEndDate', () => {
  it('returns retire date when provided', () => {
    const { endDate } = getProjectionEndDate('2040-06-15')
    expect(endDate).toBe('2040-06-15')
  })

  it('defaults to 30 years from now when null', () => {
    const { today, endDate } = getProjectionEndDate(null)
    expect(extractYear(endDate)).toBe(extractYear(today) + 30)
  })
})

describe('formatNumber', () => {
  it('formats numbers with locale separators', () => {
    expect(typeof formatNumber(1000)).toBe('string')
  })
})

describe('projectRetirements', () => {
  it('buckets retirements into yearly intervals', () => {
    const thisYear = extractYear(todayISO())
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: `${thisYear + 1}-03-15` }),
      makeEntry({ seniority_number: 2, retire_date: `${thisYear + 1}-09-15` }),
      makeEntry({ seniority_number: 3, retire_date: `${thisYear + 2}-06-01` }),
      makeEntry({ seniority_number: 5, retire_date: `${thisYear + 4}-01-01` }),
    ]
    const result = projectRetirements(entries, `${thisYear + 5}-01-01`)
    expect(result.labels.length).toBeGreaterThan(0)
    expect(result.data.length).toBe(result.labels.length)
    expect(result.filteredTotal).toBe(4)
    const totalRetirements = result.data.reduce((sum, n) => sum + n, 0)
    expect(totalRetirements).toBeGreaterThanOrEqual(3)
  })

  it('uses 30-year fallback when retireDate is null', () => {
    const result = projectRetirements([], null)
    expect(result.labels.length).toBeGreaterThan(0)
    expect(result.filteredTotal).toBe(0)
  })

  it('respects filterFn', () => {
    const thisYear = extractYear(todayISO())
    const entries = [
      makeEntry({ seniority_number: 1, base: 'JFK', retire_date: `${thisYear + 1}-06-01` }),
      makeEntry({ seniority_number: 2, base: 'LAX', retire_date: `${thisYear + 1}-06-01` }),
    ]
    const all = projectRetirements(entries, `${thisYear + 5}-01-01`)
    const jfk = projectRetirements(entries, `${thisYear + 5}-01-01`, (e) => e.base === 'JFK')
    expect(all.filteredTotal).toBe(2)
    expect(jfk.filteredTotal).toBe(1)
    expect(jfk.data.reduce((s, n) => s + n, 0)).toBeLessThanOrEqual(all.data.reduce((s, n) => s + n, 0))
  })
})

describe('projectComparativeTrajectory', () => {
  it('returns two separate trajectories for two filters', () => {
    const thisYear = extractYear(todayISO())
    const entries = [
      makeEntry({ seniority_number: 1, seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${thisYear + 1}-01-01` }),
      makeEntry({ seniority_number: 2, seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${thisYear + 2}-01-01` }),
      makeEntry({ seniority_number: 3, seat: 'FO', base: 'LAX', fleet: '777', retire_date: `${thisYear + 20}-01-01` }),
      makeEntry({ seniority_number: 5, seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${thisYear + 10}-01-01` }),
    ]
    const result = projectComparativeTrajectory(
      entries, 5, `${thisYear + 10}-01-01`,
      (e) => e.seat === 'CA' && e.base === 'JFK',
      (e) => e.seat === 'FO' && e.base === 'LAX',
    )
    expect(result.labels.length).toBeGreaterThan(0)
    expect(result.currentData.length).toBe(result.labels.length)
    expect(result.compareData.length).toBe(result.labels.length)
    const lastCurrent = result.currentData[result.currentData.length - 1]!
    const lastCompare = result.compareData[result.compareData.length - 1]!
    expect(lastCurrent).toBeGreaterThan(lastCompare)
  })
})

describe('computeTrajectoryDeltas', () => {
  it('returns empty for trajectory with < 2 points', () => {
    expect(computeTrajectoryDeltas([])).toEqual([])
    expect(computeTrajectoryDeltas([{ date: '2026-01-01', rank: 5, percentile: 50 }])).toEqual([])
  })

  it('computes correct YoY deltas', () => {
    const trajectory = [
      { date: '2026-01-01', rank: 10, percentile: 20 },
      { date: '2027-01-01', rank: 8, percentile: 25 },
      { date: '2028-01-01', rank: 5, percentile: 35 },
      { date: '2029-01-01', rank: 3, percentile: 40 },
    ]
    const deltas = computeTrajectoryDeltas(trajectory)
    expect(deltas).toHaveLength(3)
    expect(deltas[0]!.date).toBe('2027-01-01')
    expect(deltas[0]!.delta).toBe(5)
    expect(deltas[1]!.date).toBe('2028-01-01')
    expect(deltas[1]!.delta).toBe(10)
    expect(deltas[2]!.date).toBe('2029-01-01')
    expect(deltas[2]!.delta).toBe(5)
  })

  it('marks peak years correctly', () => {
    const trajectory = [
      { date: '2026-01-01', rank: 10, percentile: 20 },
      { date: '2027-01-01', rank: 8, percentile: 23 },
      { date: '2028-01-01', rank: 5, percentile: 35 },
      { date: '2029-01-01', rank: 3, percentile: 40 },
      { date: '2030-01-01', rank: 2, percentile: 42 },
    ]
    const deltas = computeTrajectoryDeltas(trajectory)
    expect(deltas[0]!.isPeak).toBe(false)
    expect(deltas[1]!.isPeak).toBe(true)
    expect(deltas[2]!.isPeak).toBe(false)
    expect(deltas[3]!.isPeak).toBe(false)
  })

  it('handles flat trajectory (all deltas 0)', () => {
    const trajectory = [
      { date: '2026-01-01', rank: 5, percentile: 50 },
      { date: '2027-01-01', rank: 5, percentile: 50 },
      { date: '2028-01-01', rank: 5, percentile: 50 },
    ]
    const deltas = computeTrajectoryDeltas(trajectory)
    expect(deltas).toHaveLength(2)
    expect(deltas[0]!.delta).toBe(0)
    expect(deltas[1]!.delta).toBe(0)
    expect(deltas[0]!.isPeak).toBe(false)
    expect(deltas[1]!.isPeak).toBe(false)
  })
})
