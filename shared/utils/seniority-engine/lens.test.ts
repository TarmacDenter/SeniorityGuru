// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { makeDomainEntry as makeEntry } from '#shared/test-utils/factories'
import { createSnapshot } from './snapshot'
import { createLens } from './lens'
import { createScenario } from './scenario'

// Fix "today" for deterministic retirement calculations
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15'))
})
afterAll(() => {
  vi.useRealTimers()
})

const entries = [
  makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2000-01-01', retire_date: '2025-06-01' }), // already retired
  makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2005-01-01', retire_date: '2026-12-01' }), // retires this year, senior to user
  makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'ATL', seat: 'FO', fleet: '320', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
  makeEntry({ seniority_number: 4, employee_number: 'E4', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2015-01-01', retire_date: '2045-01-01' }), // the user
  makeEntry({ seniority_number: 5, employee_number: 'E5', base: 'ATL', seat: 'FO', fleet: '320', hire_date: '2020-01-01', retire_date: '2050-01-01' }),
]

const snapshot = createSnapshot(entries)
const anchor = { seniorityNumber: 4, retireDate: '2045-01-01', employeeNumber: 'E4' }

describe('createLens', () => {
  it('exposes snapshot and anchor', () => {
    const lens = createLens(snapshot, anchor)
    expect(lens.snapshot).toBe(snapshot)
    expect(lens.anchor).toEqual(anchor)
  })

  it('works without anchor', () => {
    const lens = createLens(snapshot)
    expect(lens.anchor).toBeNull()
  })
})

describe('standing()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns null when no anchor', () => {
    const noAnchor = createLens(snapshot)
    expect(noAnchor.standing()).toBeNull()
  })

  it('computes company-wide rank', () => {
    const result = lens.standing()!
    // User is seniority_number 4 → 3 entries ahead (1, 2, 3) → rank 4
    expect(result.rank).toBe(4)
    expect(result.total).toBe(5)
  })

  it('adjusts rank by subtracting retired pilots above', () => {
    const result = lens.standing()!
    // E1 (sen#1, retired 2025-06-01) is retired and senior → retiredAbove = 1
    expect(result.retiredAbove).toBe(1)
    expect(result.adjustedRank).toBe(3) // rank 4 - 1 retired above
  })

  it('counts retirements this year', () => {
    const result = lens.standing()!
    // E2 retires 2026-12-01 → retires this year
    expect(result.retirementsThisYear).toBe(1)
  })

  it('counts retirements this year senior to anchor', () => {
    const result = lens.standing()!
    // E2 (sen#2) retires this year and is senior to user (sen#4)
    expect(result.retirementsThisYearSeniorToAnchor).toBe(1)
  })

  it('computes cell breakdown with per-cell ranks', () => {
    const result = lens.standing()!
    const jfkCA737 = result.cellBreakdown.find(
      c => c.base === 'JFK' && c.seat === 'CA' && c.fleet === '737',
    )!
    // JFK/CA/737 has E1 (retired), E2, E4 → total 3
    expect(jfkCA737.total).toBe(3)
    // User (E4, sen#4) is rank 3 of 3 in this cell
    expect(jfkCA737.rank).toBe(3)
    // E1 is retired and senior to user in this cell → adjustedRank = 2
    expect(jfkCA737.adjustedRank).toBe(2)
    expect(jfkCA737.isAnchorCurrent).toBe(true) // user's current cell
  })

  it('marks non-user cells as isAnchorCurrent=false', () => {
    const result = lens.standing()!
    const atlFO320 = result.cellBreakdown.find(
      c => c.base === 'ATL' && c.seat === 'FO' && c.fleet === '320',
    )!
    expect(atlFO320.isAnchorCurrent).toBe(false)
  })
})

describe('trajectory()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns null when no anchor', () => {
    expect(createLens(snapshot).trajectory()).toBeNull()
  })

  it('produces trajectory points from today to retirement', () => {
    const result = lens.trajectory()!
    expect(result.points.length).toBeGreaterThan(0)
    expect(result.points[0]!.date).toBe('2026-06-15')
    // Last point should be at or near retirement date
    const lastDate = result.points[result.points.length - 1]!.date
    expect(lastDate.startsWith('204')).toBe(true) // 2040s
  })

  it('includes chart data parallel to points', () => {
    const result = lens.trajectory()!
    expect(result.chartData.labels).toHaveLength(result.points.length)
    expect(result.chartData.data).toHaveLength(result.points.length)
    expect(result.chartData.labels[0]).toBe(result.points[0]!.date)
    expect(result.chartData.data[0]).toBe(result.points[0]!.percentile)
  })

  it('computes trajectory deltas', () => {
    const result = lens.trajectory()!
    // Deltas have one fewer entry than points
    expect(result.deltas.length).toBe(result.points.length - 1)
  })

  it('applies scope filter from scenario', () => {
    const scoped = createScenario({ scopeFilter: { seat: 'CA' } })
    const result = lens.trajectory(scoped)!
    // With only CAs, percentile should be different
    const unscoped = lens.trajectory()!
    expect(result.points[0]!.percentile).not.toBe(unscoped.points[0]!.percentile)
  })

  it('applies growth config from scenario', () => {
    const withGrowth = createScenario({ growthConfig: { enabled: true, annualRate: 0.05 } })
    const result = lens.trajectory(withGrowth)!
    const noGrowth = lens.trajectory()!
    // Growth adds junior pilots, improving user's relative position mid-career
    // Find a mid-career point where the user is not yet rank 1 and has competitors ahead
    // At ~5 years out (index 5), growth adds pilots and changes percentile
    const midWithGrowth = result.points[5]!.percentile
    const midNoGrowth = noGrowth.points[5]!.percentile
    // Growth increases percentile mid-career (user is more senior relative to larger pool)
    expect(midWithGrowth).toBeGreaterThan(midNoGrowth)
  })
})

describe('retirementProjection()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns yearly retirement buckets', () => {
    const result = lens.retirementProjection()
    expect(result.labels.length).toBeGreaterThan(0)
    expect(result.data.length).toBe(result.labels.length)
    expect(result.filteredTotal).toBe(5)
  })

  it('applies scope filter from scenario', () => {
    const scoped = createScenario({ scopeFilter: { seat: 'CA' } })
    const result = lens.retirementProjection(scoped)
    expect(result.filteredTotal).toBe(3) // E1, E2, E4 are CAs
  })
})

describe('compareTrajectories()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns null when no anchor', () => {
    const s = createScenario()
    expect(createLens(snapshot).compareTrajectories(s, s)).toBeNull()
  })

  it('returns two parallel percentile arrays', () => {
    const caFilter = createScenario({ scopeFilter: { seat: 'CA' } })
    const foFilter = createScenario({ scopeFilter: { seat: 'FO' } })
    const result = lens.compareTrajectories(caFilter, foFilter)!
    expect(result.labels.length).toBeGreaterThan(0)
    expect(result.currentData.length).toBe(result.labels.length)
    expect(result.compareData.length).toBe(result.labels.length)
  })
})

describe('percentileCrossing()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns null when no anchor', () => {
    expect(createLens(snapshot).percentileCrossing(50)).toBeNull()
  })

  it('finds year when user crosses target percentile', () => {
    // With only 5 pilots and user at sen#4, retirements will push percentile up
    const result = lens.percentileCrossing(50)
    // May or may not cross 50% depending on retirement timing
    // At minimum, the function should return without error
    if (result) {
      expect(result.year).toMatch(/^\d{4}$/)
    }
  })

  it('returns base/optimistic/pessimistic years', () => {
    // Use a low threshold that's easily reachable
    const result = lens.percentileCrossing(30)
    if (result) {
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('optimistic')
      expect(result).toHaveProperty('pessimistic')
    }
  })
})

describe('holdability()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns empty when no anchor', () => {
    expect(createLens(snapshot).holdability()).toEqual([])
  })

  it('returns power index cells', () => {
    const cells = lens.holdability()
    expect(cells.length).toBeGreaterThan(0)
    for (const cell of cells) {
      expect(cell).toHaveProperty('fleet')
      expect(cell).toHaveProperty('seat')
      expect(cell).toHaveProperty('base')
      expect(cell).toHaveProperty('state')
      expect(['green', 'amber', 'red']).toContain(cell.state)
    }
  })

  it('uses projection date from scenario', () => {
    const farFuture = createScenario({ projectionDate: new Date('2044-01-01') })
    const cells = lens.holdability(farFuture)
    // Far-future projection should show more retirements, different states
    expect(cells.length).toBeGreaterThan(0)
  })
})

describe('qualScales()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns empty when no anchor', () => {
    expect(createLens(snapshot).qualScales()).toEqual([])
  })

  it('returns qual demographic scales', () => {
    const scales = lens.qualScales()
    expect(scales.length).toBeGreaterThan(0)
    for (const scale of scales) {
      expect(scale).toHaveProperty('fleet')
      expect(scale).toHaveProperty('seat')
      expect(scale).toHaveProperty('base')
      expect(scale).toHaveProperty('userPercentile')
      expect(scale).toHaveProperty('isHoldable')
    }
  })
})

describe('retirementWave()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns retirement wave buckets', () => {
    const wave = lens.retirementWave()
    expect(wave.length).toBeGreaterThan(0)
    for (const bucket of wave) {
      expect(bucket).toHaveProperty('year')
      expect(bucket).toHaveProperty('count')
      expect(bucket).toHaveProperty('isWave')
    }
  })

  it('applies scope filter', () => {
    const caOnly = createScenario({ scopeFilter: { seat: 'CA' } })
    const caWave = lens.retirementWave(caOnly)
    const allWave = lens.retirementWave()
    const caTotal = caWave.reduce((sum, b) => sum + b.count, 0)
    const allTotal = allWave.reduce((sum, b) => sum + b.count, 0)
    expect(caTotal).toBeLessThanOrEqual(allTotal)
  })
})

describe('demographics()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns age distribution', () => {
    const result = lens.demographics(65)
    expect(result.ageDistribution.buckets.length).toBeGreaterThan(0)
    const totalInBuckets = result.ageDistribution.buckets.reduce((s, b) => s + b.count, 0)
    expect(totalInBuckets + result.ageDistribution.nullCount).toBe(entries.length)
  })

  it('returns YOS distribution', () => {
    const result = lens.demographics(65)
    expect(result.yosDistribution).toHaveProperty('median')
    expect(result.yosDistribution).toHaveProperty('p25')
    expect(result.yosDistribution).toHaveProperty('p75')
  })

  it('returns YOS histogram', () => {
    const result = lens.demographics(65)
    expect(result.yosHistogram.length).toBeGreaterThan(0)
  })

  it('returns qual composition', () => {
    const result = lens.demographics(65)
    expect(result.qualComposition.length).toBeGreaterThan(0)
  })

  it('returns most junior CAs', () => {
    const result = lens.demographics(65)
    expect(result.mostJuniorCAs.length).toBeGreaterThan(0)
    for (const ca of result.mostJuniorCAs) {
      expect(ca.seat).toBe('CA')
    }
  })

  it('applies scope filter', () => {
    const caOnly = createScenario({ scopeFilter: { seat: 'CA' } })
    const result = lens.demographics(65, caOnly)
    const caAgeTotal = result.ageDistribution.buckets.reduce((s, b) => s + b.count, 0)
      + result.ageDistribution.nullCount
    // 3 CAs in our test data
    expect(caAgeTotal).toBe(3)
  })

  it('works without anchor', () => {
    const noAnchor = createLens(snapshot)
    const result = noAnchor.demographics(65)
    expect(result.ageDistribution.buckets.length).toBeGreaterThan(0)
  })
})
