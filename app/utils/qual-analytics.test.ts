// @vitest-environment node
import { describe, it, expect } from 'vitest'
import type { SeniorityEntry, SeniorityEntryInput } from '~/utils/schemas/seniority-list'
import { deriveAge, computeYOS } from '~/utils/date'
import {
  qualKey,
  computeAgeDistribution,
  findMostJuniorCA,
  computeYosDistribution,
  computeYosHistogram,
  computeQualComposition,
  computeRetirementWave,
  applyProjectionToSnapshots,
  computeQualSnapshots,
  findThresholdYear,
} from './qual-analytics'
import type { GrowthConfig } from '~/utils/seniority-engine'
import { makeEntry as _makeEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'

const AS_OF = parsePlainDate('2026-01-01')

function makeEntry(overrides: Partial<SeniorityEntryInput> = {}): SeniorityEntry {
  return _makeEntry({
    seat: 'FO',
    base: 'JFK',
    fleet: '737',
    hire_date: '2010-01-01',
    retire_date: '2055-01-01',
    ...overrides,
  })
}

// ─── qualKey ─────────────────────────────────────────────────────────────────
describe('qualKey', () => {
  it('returns "fleet seat" string', () => {
    expect(qualKey(makeEntry({ fleet: '737', seat: 'CA' }))).toBe('737 CA')
  })
  it('returns non-empty string for valid fleet and seat', () => {
    expect(qualKey(makeEntry({ fleet: '320', seat: 'FO' }))).toBe('320 FO')
  })
})

// ─── deriveAge ────────────────────────────────────────────────────────────────
describe('deriveAge', () => {
  it('returns ~57 for pilot retiring in 2033 at age 65', () => {
    const age = deriveAge('2033-01-01', 65, AS_OF)
    // Born ~2033 - 65 = 1968; current age ~57 (2026 - 1968)
    expect(age).toBeGreaterThanOrEqual(55)
    expect(age).toBeLessThanOrEqual(60)
  })
  it('returns ~40 for pilot retiring in 2051 at age 65', () => {
    const age = deriveAge('2051-01-01', 65, AS_OF)
    expect(age).toBeGreaterThanOrEqual(38)
    expect(age).toBeLessThanOrEqual(43)
  })
})

// ─── computeYOS ──────────────────────────────────────────────────────────────
describe('computeYOS', () => {
  it('returns ~16 for pilot hired 2010-01-01 (as of 2026)', () => {
    const yos = computeYOS('2010-01-01', AS_OF)
    expect(yos).toBeGreaterThanOrEqual(15.5)
    expect(yos).toBeLessThanOrEqual(17)
  })
  it('returns near 0 for today', () => {
    expect(computeYOS(AS_OF, AS_OF)).toBeLessThan(0.01)
  })
})

// ─── computeAgeDistribution ───────────────────────────────────────────────────
describe('computeAgeDistribution', () => {
  it('groups entries into correct age buckets', () => {
    const entries = [
      // retire 2030 → born ~1965 → age ~61 → bucket "60–64"
      makeEntry({ retire_date: '2030-01-01' }),
      // retire 2040 → born ~1975 → age ~51 → bucket "50–54"
      makeEntry({ retire_date: '2040-01-01' }),
    ]
    const { buckets, nullCount } = computeAgeDistribution(entries, 65, undefined, AS_OF)
    expect(nullCount).toBe(0)
    const bucket6064 = buckets.find((b) => b.label === '60–64')
    const bucket5054 = buckets.find((b) => b.label === '50–54')
    expect(bucket6064?.count).toBe(1)
    expect(bucket5054?.count).toBe(1)
  })

  it('applies filterFn', () => {
    const entries = [
      makeEntry({ fleet: '737', retire_date: '2030-01-01' }),
      makeEntry({ fleet: '787', retire_date: '2030-01-01' }),
    ]
    const { buckets } = computeAgeDistribution(entries, 65, (e) => e.fleet === '737', AS_OF)
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0)
    expect(totalCount).toBe(1)
  })
})

// ─── findMostJuniorCA ─────────────────────────────────────────────────────────
describe('findMostJuniorCA', () => {
  it('returns the pilot with highest seniority_number per qual (fleet+seat+base)', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 100 }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 500 }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'LAX', seniority_number: 300 }),
      makeEntry({ fleet: '787', seat: 'CA', base: 'JFK', seniority_number: 50 }),
    ]
    const result = findMostJuniorCA(entries, AS_OF)
    const r737JFK = result.find((r) => r.fleet === '737' && r.base === 'JFK')
    const r737LAX = result.find((r) => r.fleet === '737' && r.base === 'LAX')
    const r787 = result.find((r) => r.fleet === '787')
    expect(r737JFK?.seniorityNumber).toBe(500)
    expect(r737LAX?.seniorityNumber).toBe(300)
    expect(r787?.seniorityNumber).toBe(50)
  })

  it('includes qualKey, seat, and base in return value', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'ATL', seniority_number: 200 }),
    ]
    const result = findMostJuniorCA(entries, AS_OF)
    expect(result[0]?.qualKey).toBe('737 CA ATL')
    expect(result[0]?.seat).toBe('CA')
    expect(result[0]?.base).toBe('ATL')
  })

  it('ignores FO entries', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'FO', seniority_number: 1 }),
      makeEntry({ fleet: '737', seat: 'CA', seniority_number: 200 }),
    ]
    const result = findMostJuniorCA(entries, AS_OF)
    expect(result).toHaveLength(1)
    expect(result[0]?.seniorityNumber).toBe(200)
  })

  it('returns empty array when no CAs', () => {
    expect(findMostJuniorCA([makeEntry({ seat: 'FO' })], AS_OF)).toEqual([])
  })
})

// ─── computeYosDistribution ───────────────────────────────────────────────────
describe('computeYosDistribution', () => {
  it('returns zeros for empty input', () => {
    const result = computeYosDistribution([], undefined, AS_OF)
    expect(result).toEqual({ entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 })
  })

  it('sets entryFloor to YOS of most junior entry', () => {
    const entries = [
      makeEntry({ seniority_number: 1, hire_date: '2000-01-01' }),  // most senior, hired early
      makeEntry({ seniority_number: 10, hire_date: '2018-01-01' }), // most junior, hired latest
    ]
    const result = computeYosDistribution(entries, undefined, AS_OF)
    // Most junior (seniority_number 10) has hire_date 2018 → ~8 yos
    expect(result.entryFloor).toBeLessThan(10)
    expect(result.entryFloor).toBeGreaterThan(6)
  })

  it('computes median correctly for odd-length array', () => {
    const entries = [
      makeEntry({ seniority_number: 1, hire_date: '2000-01-01' }), // ~26 yos
      makeEntry({ seniority_number: 2, hire_date: '2010-01-01' }), // ~16 yos
      makeEntry({ seniority_number: 3, hire_date: '2020-01-01' }), // ~6 yos
    ]
    const result = computeYosDistribution(entries, undefined, AS_OF)
    // Sorted: [~6, ~16, ~26] — median index 1 → ~16
    expect(result.median).toBeGreaterThan(14)
    expect(result.median).toBeLessThan(18)
  })
})

// ─── computeYosHistogram ──────────────────────────────────────────────────────
describe('computeYosHistogram', () => {
  it('returns empty array for no entries', () => {
    const result = computeYosHistogram([], undefined, AS_OF)
    expect(result).toHaveLength(0)
  })

  it('places pilot hired in 2010 in the year-16 bucket (2026 - 2010 ≈ 16 yos)', () => {
    const result = computeYosHistogram([makeEntry({ hire_date: '2010-01-01' })], undefined, AS_OF)
    const bucket = result.find((b) => b.label === '16')
    expect(bucket?.count).toBe(1)
  })

  it('creates one bucket per year up to max YOS', () => {
    const result = computeYosHistogram([
      makeEntry({ hire_date: '2020-01-01' }), // ~6 yos
      makeEntry({ hire_date: '2010-01-01' }), // ~16 yos
    ], undefined, AS_OF)
    // Buckets span 0 to ceil(maxYos), one per year
    expect(result[0]!.label).toBe('0')
    // The 2010 entry has ~16.2 yos → ceil = 17 → buckets 0..17
    expect(result.length).toBeGreaterThanOrEqual(17)
    // Each entry lands in exactly one bucket
    const total = result.reduce((sum, b) => sum + b.count, 0)
    expect(total).toBe(2)
  })

  it('applies filterFn', () => {
    const entries = [
      makeEntry({ fleet: '737', hire_date: '2010-01-01' }),
      makeEntry({ fleet: '777', hire_date: '2010-01-01' }),
    ]
    const result = computeYosHistogram(entries, (e) => e.fleet === '737', AS_OF)
    const total = result.reduce((sum, b) => sum + b.count, 0)
    expect(total).toBe(1)
  })
})

// ─── computeQualComposition ───────────────────────────────────────────────────
describe('computeQualComposition', () => {
  it('groups by fleet+seat and computes counts', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'LAX' }),
      makeEntry({ fleet: '737', seat: 'FO', base: 'JFK' }),
    ]
    const result = computeQualComposition(entries)
    const ca737 = result.find((r) => r.qualKey === '737 CA')
    const fo737 = result.find((r) => r.qualKey === '737 FO')
    expect(ca737?.total).toBe(2)
    expect(ca737?.caCount).toBe(2)
    expect(fo737?.total).toBe(1)
    expect(fo737?.foCount).toBe(1)
  })

  it('byBase percentages sum to ~100', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'LAX' }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'ORD' }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'ORD' }),
    ]
    const result = computeQualComposition(entries)
    const ca737 = result.find((r) => r.qualKey === '737 CA')!
    const total = ca737.byBase.reduce((sum, b) => sum + b.pct, 0)
    expect(total).toBeCloseTo(100, 0)
  })

  it('groups all valid entries', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA' }),
      makeEntry({ fleet: '787', seat: 'FO' }),
    ]
    const result = computeQualComposition(entries)
    expect(result).toHaveLength(2)
  })
})

// ─── computeRetirementWave ────────────────────────────────────────────────────
describe('computeRetirementWave', () => {
  it('marks wave years (count >= 1.5× mean)', () => {
    // 3 buckets: year 2028→1, 2029→1, 2030→6
    // mean = (1+1+6)/3 = 2.67, threshold = 2.67*1.5 = 4
    // 2030 (count=6) is a wave; 2028 and 2029 are not
    const entries = [
      makeEntry({ retire_date: '2028-06-01' }),
      makeEntry({ retire_date: '2029-06-01' }),
      makeEntry({ retire_date: '2030-01-01' }),
      makeEntry({ retire_date: '2030-02-01' }),
      makeEntry({ retire_date: '2030-03-01' }),
      makeEntry({ retire_date: '2030-04-01' }),
      makeEntry({ retire_date: '2030-05-01' }),
      makeEntry({ retire_date: '2030-06-01' }),
    ]
    const result = computeRetirementWave(entries)
    expect(result.find((b) => b.year === 2030)?.isWave).toBe(true)
    expect(result.find((b) => b.year === 2028)?.isWave).toBe(false)
    expect(result.find((b) => b.year === 2029)?.isWave).toBe(false)
  })

  it('returns results sorted by year asc', () => {
    const entries = [
      makeEntry({ retire_date: '2031-01-01' }),
      makeEntry({ retire_date: '2029-01-01' }),
      makeEntry({ retire_date: '2030-01-01' }),
    ]
    const result = computeRetirementWave(entries)
    expect(result.map((b) => b.year)).toEqual([2029, 2030, 2031])
  })

})

// ─── applyProjectionToSnapshots with growth ─────────────────────────────────
describe('applyProjectionToSnapshots with growthConfig', () => {
  it('growth increases projected userPercentile but not currentUserPercentile', () => {
    // Create entries with qual data (fleet+seat+base) so snapshots are generated
    const entries = Array.from({ length: 20 }, (_, i) => makeEntry({
      seniority_number: i + 1,
      employee_number: `EMP${String(i + 1).padStart(4, '0')}`,
      fleet: '737', seat: 'CA', base: 'JFK',
      retire_date: `${2030 + i}-01-01`,
    }))
    const snapshots = computeQualSnapshots(entries, AS_OF)
    const projectionDate = parsePlainDate('2035-01-01')
    const growthEnabled: GrowthConfig = { enabled: true, annualRate: 0.05 }

    const withoutGrowth = applyProjectionToSnapshots(snapshots, entries, 10, projectionDate, undefined, AS_OF)
    const withGrowth = applyProjectionToSnapshots(snapshots, entries, 10, projectionDate, growthEnabled, AS_OF)

    // currentUserPercentile should be the same (no growth at today's date)
    expect(withGrowth[0]!.currentUserPercentile).toBe(withoutGrowth[0]!.currentUserPercentile)
    // projected userPercentile should be higher with growth
    expect(withGrowth[0]!.userPercentile).toBeGreaterThan(withoutGrowth[0]!.userPercentile)
  })
})

// ─── findThresholdYear ────────────────────────────────────────────────────────
describe('findThresholdYear', () => {
  function makeTrajectory(years: number[], percentiles: number[]) {
    return years.map((y, i) => ({ date: `${y}-01-01`, rank: 100, percentile: percentiles[i]! }))
  }

  it('returns null when threshold is never crossed', () => {
    const traj = makeTrajectory([2026, 2027, 2028], [30, 40, 45])
    expect(findThresholdYear(traj, 50)).toBeNull()
  })

  it('returns the year of first crossing', () => {
    const traj = makeTrajectory([2026, 2027, 2028], [40, 51, 60])
    const result = findThresholdYear(traj, 50)
    expect(result?.year).toBe('2027')
  })

  it('returns only a year (no optimistic/pessimistic fields)', () => {
    const base = makeTrajectory([2026, 2027], [40, 60])
    const result = findThresholdYear(base, 50)
    expect(result?.year).toBe('2027')
    expect(result).not.toHaveProperty('optimistic')
    expect(result).not.toHaveProperty('pessimistic')
  })
})
