// @vitest-environment node
import { describe, it, expect } from 'vitest'
import type { Tables } from '#shared/types/database'
import {
  qualKey,
  deriveAge,
  computeYOS,
  computeAgeDistribution,
  findMostJuniorCA,
  computeYosDistribution,
  computeQualComposition,
  computeRetirementWave,
  computePowerIndexCells,
  findThresholdYear,
  detectUpgradeTransitions,
} from './qual-analytics'

type SeniorityEntry = Tables<'seniority_entries'>

// ─── Test factory ─────────────────────────────────────────────────────────────
let _nextId = 1
function makeEntry(overrides: Partial<SeniorityEntry> = {}): SeniorityEntry {
  const id = _nextId++
  return {
    id: `entry-${id}`,
    list_id: 'list-1',
    seniority_number: id,
    employee_number: `EMP${String(id).padStart(4, '0')}`,
    name: `Pilot_${id}`,
    seat: 'FO',
    base: 'JFK',
    fleet: '737',
    hire_date: '2010-01-01',
    retire_date: null,
    ...overrides,
  }
}

// ─── qualKey ─────────────────────────────────────────────────────────────────
describe('qualKey', () => {
  it('returns "fleet seat" string', () => {
    expect(qualKey(makeEntry({ fleet: '737', seat: 'CA' }))).toBe('737 CA')
  })
  it('returns empty string when fleet is null', () => {
    expect(qualKey(makeEntry({ fleet: null, seat: 'CA' }))).toBe('')
  })
  it('returns empty string when seat is null', () => {
    expect(qualKey(makeEntry({ fleet: '737', seat: null }))).toBe('')
  })
})

// ─── deriveAge ────────────────────────────────────────────────────────────────
describe('deriveAge', () => {
  it('returns ~57 for pilot retiring in 2033 at age 65', () => {
    const age = deriveAge('2033-01-01', 65)
    // Born ~2033 - 65 = 1968; current age ~57 (2026 - 1968)
    expect(age).toBeGreaterThanOrEqual(55)
    expect(age).toBeLessThanOrEqual(60)
  })
  it('returns ~40 for pilot retiring in 2051 at age 65', () => {
    const age = deriveAge('2051-01-01', 65)
    expect(age).toBeGreaterThanOrEqual(38)
    expect(age).toBeLessThanOrEqual(43)
  })
})

// ─── computeYOS ──────────────────────────────────────────────────────────────
describe('computeYOS', () => {
  it('returns ~16 for pilot hired 2010-01-01 (as of 2026)', () => {
    const yos = computeYOS('2010-01-01')
    expect(yos).toBeGreaterThanOrEqual(15.5)
    expect(yos).toBeLessThanOrEqual(17)
  })
  it('returns near 0 for today', () => {
    const today = new Date().toISOString().split('T')[0]!
    expect(computeYOS(today)).toBeLessThan(0.01)
  })
})

// ─── computeAgeDistribution ───────────────────────────────────────────────────
describe('computeAgeDistribution', () => {
  it('groups entries into correct buckets and counts nulls', () => {
    const entries = [
      // retire 2030 → born ~1965 → age ~61 → bucket "60–64"
      makeEntry({ retire_date: '2030-01-01' }),
      // retire 2040 → born ~1975 → age ~51 → bucket "50–54"
      makeEntry({ retire_date: '2040-01-01' }),
      // no retire_date → null
      makeEntry({ retire_date: null }),
    ]
    const { buckets, nullCount } = computeAgeDistribution(entries, 65)
    expect(nullCount).toBe(1)
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
    const { buckets } = computeAgeDistribution(entries, 65, (e) => e.fleet === '737')
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0)
    expect(totalCount).toBe(1)
  })
})

// ─── findMostJuniorCA ─────────────────────────────────────────────────────────
describe('findMostJuniorCA', () => {
  it('returns the pilot with highest seniority_number per fleet', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', seniority_number: 100 }),
      makeEntry({ fleet: '737', seat: 'CA', seniority_number: 500 }),
      makeEntry({ fleet: '737', seat: 'CA', seniority_number: 300 }),
      makeEntry({ fleet: '787', seat: 'CA', seniority_number: 50 }),
    ]
    const result = findMostJuniorCA(entries)
    const r737 = result.find((r) => r.fleet === '737')
    const r787 = result.find((r) => r.fleet === '787')
    expect(r737?.seniorityNumber).toBe(500)
    expect(r787?.seniorityNumber).toBe(50)
  })

  it('ignores FO entries', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'FO', seniority_number: 1 }),
      makeEntry({ fleet: '737', seat: 'CA', seniority_number: 200 }),
    ]
    const result = findMostJuniorCA(entries)
    expect(result).toHaveLength(1)
    expect(result[0]?.seniorityNumber).toBe(200)
  })

  it('returns empty array when no CAs', () => {
    expect(findMostJuniorCA([makeEntry({ seat: 'FO' })])).toEqual([])
  })
})

// ─── computeYosDistribution ───────────────────────────────────────────────────
describe('computeYosDistribution', () => {
  it('returns zeros for empty input', () => {
    const result = computeYosDistribution([])
    expect(result).toEqual({ entryFloor: 0, p25: 0, median: 0, p75: 0, max: 0 })
  })

  it('sets entryFloor to YOS of most junior entry', () => {
    const entries = [
      makeEntry({ seniority_number: 1, hire_date: '2000-01-01' }),  // most senior, hired early
      makeEntry({ seniority_number: 10, hire_date: '2018-01-01' }), // most junior, hired latest
    ]
    const result = computeYosDistribution(entries)
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
    const result = computeYosDistribution(entries)
    // Sorted: [~6, ~16, ~26] — median index 1 → ~16
    expect(result.median).toBeGreaterThan(14)
    expect(result.median).toBeLessThan(18)
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

  it('skips entries with null fleet or seat', () => {
    const entries = [
      makeEntry({ fleet: null, seat: 'CA' }),
      makeEntry({ fleet: '737', seat: null }),
      makeEntry({ fleet: '737', seat: 'CA' }),
    ]
    const result = computeQualComposition(entries)
    expect(result).toHaveLength(1)
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

  it('excludes entries with null retire_date', () => {
    const entries = [
      makeEntry({ retire_date: null }),
      makeEntry({ retire_date: '2030-01-01' }),
    ]
    const result = computeRetirementWave(entries)
    expect(result).toHaveLength(1)
  })

  it('returns empty array when no entries have retire_date', () => {
    expect(computeRetirementWave([makeEntry({ retire_date: null })])).toEqual([])
  })
})

// ─── computePowerIndexCells ───────────────────────────────────────────────────
describe('computePowerIndexCells', () => {
  const TODAY = new Date('2026-01-01')
  const FUTURE = new Date('2029-01-01')

  it('green when user can hold today (more senior than most junior active)', () => {
    // User seniority_number=50. Cell has pilots with sen_nums 100,200,300 — all more junior.
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 100, retire_date: null }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 200, retire_date: null }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 300, retire_date: null }),
    ]
    const cells = computePowerIndexCells(entries, 50, TODAY)
    expect(cells[0]?.state).toBe('green')
    expect(cells[0]?.remainingNeeded).toBe(0)
  })

  it('green after retirements clear the blocking pilots', () => {
    // User seniority_number=150. Cell has sen_nums 100 (retiring) and 200 (staying).
    // After retirement of 100: most junior active = 200, user 150 <= 200 → green
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 100, retire_date: '2028-01-01' }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 200, retire_date: null }),
    ]
    const cells = computePowerIndexCells(entries, 150, FUTURE)
    expect(cells[0]?.state).toBe('green')
  })

  it('amber when remaining pilots ahead <= 10% of total cell size', () => {
    // 20-pilot cell, user is blocked by 1 active pilot (5% of 20 → amber)
    const entries: SeniorityEntry[] = []
    for (let i = 1; i <= 19; i++) {
      entries.push(makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: i, retire_date: '2025-01-01' }))
    }
    // 1 pilot more senior than user still active
    entries.push(makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 50, retire_date: null }))
    const cells = computePowerIndexCells(entries, 100, TODAY)
    expect(cells[0]?.state).toBe('amber')
    expect(cells[0]?.remainingNeeded).toBe(1)
  })

  it('red when many pilots still blocking', () => {
    const entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 1, retire_date: null }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 2, retire_date: null }),
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK', seniority_number: 3, retire_date: null }),
    ]
    const cells = computePowerIndexCells(entries, 9999, TODAY)
    expect(cells[0]?.state).toBe('red')
  })
})

// ─── findThresholdYear ────────────────────────────────────────────────────────
describe('findThresholdYear', () => {
  function makeTrajectory(years: number[], percentiles: number[]) {
    return years.map((y, i) => ({ date: `${y}-01-01`, rank: 100, percentile: percentiles[i]! }))
  }

  it('returns null when threshold is never crossed', () => {
    const traj = makeTrajectory([2026, 2027, 2028], [30, 40, 45])
    expect(findThresholdYear(traj, traj, traj, 50)).toBeNull()
  })

  it('returns the year of first crossing', () => {
    const traj = makeTrajectory([2026, 2027, 2028], [40, 51, 60])
    const result = findThresholdYear(traj, traj, traj, 50)
    expect(result?.year).toBe('2027')
  })

  it('returns null for optimistic when that trajectory never crosses', () => {
    const base = makeTrajectory([2026, 2027], [40, 60])
    const optimistic = makeTrajectory([2026, 2027], [40, 55])
    const pessimistic = makeTrajectory([2026, 2027], [40, 30])
    const result = findThresholdYear(base, optimistic, pessimistic, 50)
    expect(result?.year).toBe('2027')
    expect(result?.optimistic).toBe('2027')
    expect(result?.pessimistic).toBeNull()
  })
})

// ─── detectUpgradeTransitions ─────────────────────────────────────────────────
describe('detectUpgradeTransitions', () => {
  it('detects FO→CA upgrade on same fleet', () => {
    const older = [makeEntry({ employee_number: 'EMP001', fleet: '737', seat: 'FO', seniority_number: 100 })]
    const newer = [makeEntry({ employee_number: 'EMP001', fleet: '737', seat: 'CA', seniority_number: 100 })]
    const result = detectUpgradeTransitions(older, newer)
    expect(result).toHaveLength(1)
    expect(result[0]?.type).toBe('upgrade')
  })

  it('detects CA→FO downgrade', () => {
    const older = [makeEntry({ employee_number: 'EMP001', fleet: '737', seat: 'CA', seniority_number: 10 })]
    const newer = [makeEntry({ employee_number: 'EMP001', fleet: '737', seat: 'FO', seniority_number: 10 })]
    const result = detectUpgradeTransitions(older, newer)
    expect(result[0]?.type).toBe('downgrade')
  })

  it('detects fleet change', () => {
    const older = [makeEntry({ employee_number: 'EMP001', fleet: '737', seat: 'CA', seniority_number: 10 })]
    const newer = [makeEntry({ employee_number: 'EMP001', fleet: '787', seat: 'CA', seniority_number: 10 })]
    const result = detectUpgradeTransitions(older, newer)
    expect(result[0]?.type).toBe('fleet-change')
  })

  it('ignores pilots with no change', () => {
    const older = [makeEntry({ employee_number: 'EMP001', fleet: '737', seat: 'CA' })]
    const newer = [makeEntry({ employee_number: 'EMP001', fleet: '737', seat: 'CA' })]
    expect(detectUpgradeTransitions(older, newer)).toHaveLength(0)
  })

  it('ignores pilots not in older list (new hires)', () => {
    const older: SeniorityEntry[] = []
    const newer = [makeEntry({ employee_number: 'NEWHIRE', fleet: '737', seat: 'FO' })]
    expect(detectUpgradeTransitions(older, newer)).toHaveLength(0)
  })
})
