import type { Tables } from '#shared/types/database'
import type { FilterFn } from '#shared/utils/seniority-math'

type SeniorityEntry = Tables<'seniority_entries'>

// Re-export TrajectoryPoint for consumers (matches buildTrajectory return shape)
export interface TrajectoryPoint {
  date: string
  rank: number
  percentile: number
}

// ─── Qual key ────────────────────────────────────────────────────────────────
// "737 CA", "320 FO" — base is ALWAYS a filter dimension, never part of the key

export function qualKey(entry: SeniorityEntry): string {
  if (!entry.fleet || !entry.seat) return ''
  return `${entry.fleet} ${entry.seat}`
}

// ─── Age derivation ───────────────────────────────────────────────────────────
// Pilots retire at mandatory age, so we back-calculate approximate birth date.
// Applied uniformly across all entries using the viewer's mandatory_retirement_age.

export function deriveAge(retireDate: string, mandatoryAge: number): number {
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000
  const retireMs = new Date(retireDate).getTime()
  const birthMs = retireMs - mandatoryAge * MS_PER_YEAR
  return Math.floor((Date.now() - birthMs) / MS_PER_YEAR)
}

// ─── Years of service ─────────────────────────────────────────────────────────

export function computeYOS(hireDateStr: string): number {
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000
  return (Date.now() - new Date(hireDateStr).getTime()) / MS_PER_YEAR
}

// ─── Age distribution ─────────────────────────────────────────────────────────

export interface AgeBucket {
  label: string
  count: number
}

const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '< 30', min: 0, max: 29 },
  { label: '30–34', min: 30, max: 34 },
  { label: '35–39', min: 35, max: 39 },
  { label: '40–44', min: 40, max: 44 },
  { label: '45–49', min: 45, max: 49 },
  { label: '50–54', min: 50, max: 54 },
  { label: '55–59', min: 55, max: 59 },
  { label: '60–64', min: 60, max: 64 },
  { label: '65+', min: 65, max: Infinity },
]

export function computeAgeDistribution(
  entries: SeniorityEntry[],
  mandatoryAge: number,
  filterFn?: FilterFn,
): { buckets: AgeBucket[]; nullCount: number } {
  const filtered = filterFn ? entries.filter(filterFn) : entries
  const counts = new Array<number>(AGE_BUCKETS.length).fill(0)
  let nullCount = 0

  for (const e of filtered) {
    if (!e.retire_date) { nullCount++; continue }
    const age = deriveAge(e.retire_date, mandatoryAge)
    const idx = AGE_BUCKETS.findIndex((b) => age >= b.min && age <= b.max)
    if (idx >= 0) counts[idx]!++
  }

  return {
    buckets: AGE_BUCKETS.map((b, i) => ({ label: b.label, count: counts[i]! })),
    nullCount,
  }
}

// ─── Most junior CA per qual (fleet + seat + base) ───────────────────────────

export interface MostJuniorCARow {
  qualKey: string       // e.g. "737 CA ATL"
  fleet: string
  seat: string
  base: string | null
  seniorityNumber: number
  hireDate: string
  yos: number
}

export function findMostJuniorCA(entries: SeniorityEntry[]): MostJuniorCARow[] {
  const byQual = new Map<string, SeniorityEntry>()
  for (const e of entries) {
    if (e.seat !== 'CA' || !e.fleet) continue
    const key = `${e.fleet}|${e.seat}|${e.base ?? ''}`
    const existing = byQual.get(key)
    if (!existing || e.seniority_number > existing.seniority_number) {
      byQual.set(key, e)
    }
  }
  return Array.from(byQual.values())
    .map((e) => ({
      qualKey: [e.fleet, e.seat, e.base].filter(Boolean).join(' '),
      fleet: e.fleet!,
      seat: e.seat!,
      base: e.base,
      seniorityNumber: e.seniority_number,
      hireDate: e.hire_date,
      yos: computeYOS(e.hire_date),
    }))
    .sort((a, b) => a.qualKey.localeCompare(b.qualKey))
}

// ─── YOS distribution ─────────────────────────────────────────────────────────

export interface YosDistribution {
  entryFloor: number
  p10: number
  p25: number
  median: number
  p75: number
  p90: number
  max: number
}

export interface YosHistogramBucket {
  label: string
  minYos: number
  count: number
}

export function computeYosHistogram(
  entries: SeniorityEntry[],
  filterFn?: FilterFn,
): YosHistogramBucket[] {
  const filtered = filterFn ? entries.filter(filterFn) : entries
  if (filtered.length === 0) return []
  const yosValues = filtered.map((e) => computeYOS(e.hire_date))
  const maxYos = Math.ceil(Math.max(...yosValues))
  const bucketCount = Math.max(maxYos + 1, 1)
  const counts = new Array<number>(bucketCount).fill(0)
  for (const yos of yosValues) {
    const idx = Math.min(Math.floor(yos), bucketCount - 1)
    counts[idx]!++
  }
  return counts.map((count, i) => ({
    label: String(i),
    minYos: i,
    count,
  }))
}

function percentileOf(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]!
}

export function computeYosDistribution(
  entries: SeniorityEntry[],
  filterFn?: FilterFn,
): YosDistribution {
  const filtered = filterFn ? entries.filter(filterFn) : entries
  if (filtered.length === 0) return { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 }

  const sorted = filtered
    .map((e) => computeYOS(e.hire_date))
    .sort((a, b) => a - b)

  const mostJunior = filtered.reduce((a, b) =>
    a.seniority_number > b.seniority_number ? a : b,
  )
  const entryFloor = computeYOS(mostJunior.hire_date)

  return {
    entryFloor,
    p10: percentileOf(sorted, 10),
    p25: percentileOf(sorted, 25),
    median: percentileOf(sorted, 50),
    p75: percentileOf(sorted, 75),
    p90: percentileOf(sorted, 90),
    max: sorted[sorted.length - 1]!,
  }
}

// ─── Qual size & composition ──────────────────────────────────────────────────

export interface QualCompositionRow {
  qualKey: string
  fleet: string
  seat: string
  total: number
  caCount: number
  foCount: number
  caFoRatio: number
  byBase: { base: string; count: number; pct: number }[]
}

export function computeQualComposition(entries: SeniorityEntry[]): QualCompositionRow[] {
  const byQual = new Map<string, SeniorityEntry[]>()
  for (const e of entries) {
    const key = qualKey(e)
    if (!key) continue
    let group = byQual.get(key)
    if (!group) { group = []; byQual.set(key, group) }
    group.push(e)
  }

  return Array.from(byQual.entries()).map(([key, group]) => {
    const { fleet, seat } = group[0]!
    const total = group.length
    const caCount = group.filter((e) => e.seat === 'CA').length
    const foCount = group.filter((e) => e.seat === 'FO').length

    const baseCounts = new Map<string, number>()
    for (const e of group) {
      if (!e.base) continue
      baseCounts.set(e.base, (baseCounts.get(e.base) ?? 0) + 1)
    }
    const byBase = Array.from(baseCounts.entries())
      .map(([base, count]) => ({ base, count, pct: Math.round((count / total) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count)

    return {
      qualKey: key,
      fleet: fleet!,
      seat: seat!,
      total,
      caCount,
      foCount,
      caFoRatio: Math.round((caCount / Math.max(foCount, 1)) * 100) / 100,
      byBase,
    }
  })
}

// ─── Retirement wave ──────────────────────────────────────────────────────────

export interface RetirementWaveBucket {
  year: number
  count: number
  isWave: boolean
}

export function computeRetirementWave(
  entries: SeniorityEntry[],
  filterFn?: FilterFn,
): RetirementWaveBucket[] {
  const filtered = filterFn ? entries.filter(filterFn) : entries
  const withDates = filtered.filter((e) => !!e.retire_date)

  const countByYear = new Map<number, number>()
  for (const e of withDates) {
    const year = new Date(e.retire_date!).getUTCFullYear()
    countByYear.set(year, (countByYear.get(year) ?? 0) + 1)
  }

  if (countByYear.size === 0) return []

  const counts = Array.from(countByYear.values())
  const mean = counts.reduce((sum, n) => sum + n, 0) / counts.length
  const waveThreshold = mean * 1.5

  return Array.from(countByYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count, isWave: count >= waveThreshold }))
}

// ─── Power Index ──────────────────────────────────────────────────────────────

export type PowerIndexCellState = 'green' | 'amber' | 'red'

export interface PowerIndexCell {
  fleet: string
  seat: string
  base: string
  state: PowerIndexCellState
  retiredCount: number
  totalInCell: number
  remainingNeeded: number
  isLowestSeniority: boolean
  percentile: number  // user's percentile rank within the cell (0–100, higher = more senior)
}

export function computePowerIndexCells(
  entries: SeniorityEntry[],
  userSenNum: number,
  projectionDate: Date,
): PowerIndexCell[] {
  // Group by fleet+seat+base
  const byCellKey = new Map<string, SeniorityEntry[]>()
  for (const e of entries) {
    if (!e.fleet || !e.seat || !e.base) continue
    const key = `${e.fleet}|${e.seat}|${e.base}`
    let group = byCellKey.get(key)
    if (!group) { group = []; byCellKey.set(key, group) }
    group.push(e)
  }

  return Array.from(byCellKey.values()).map((cellEntries) => {
    const { fleet, seat, base } = cellEntries[0]!
    const total = cellEntries.length

    const remaining = cellEntries.filter((e) => {
      if (!e.retire_date) return true
      return new Date(e.retire_date) > projectionDate
    })
    const retiredCount = total - remaining.length

    const mostJuniorActiveSenNum = remaining.length > 0
      ? Math.max(...remaining.map((e) => e.seniority_number))
      : 0

    const isHoldable = remaining.length > 0 && userSenNum <= mostJuniorActiveSenNum

    const moreJunior = remaining.filter((e) => e.seniority_number > userSenNum).length
    const percentile = remaining.length > 0
      ? Math.round((moreJunior / remaining.length) * 100)
      : 0

    if (isHoldable) {
      // Most junior in cell → amber (unlikely to actually hold)
      if (moreJunior === 0) {
        return {
          fleet: fleet!, seat: seat!, base: base!,
          state: 'amber', retiredCount, totalInCell: total, remainingNeeded: 0,
          isLowestSeniority: true, percentile,
        }
      }
      return {
        fleet: fleet!, seat: seat!, base: base!,
        state: 'green', retiredCount, totalInCell: total, remainingNeeded: 0,
        isLowestSeniority: false, percentile,
      }
    }

    const stillAhead = remaining.filter((e) => e.seniority_number < userSenNum).length
    const amberThreshold = Math.ceil(total * 0.10)
    const state: PowerIndexCellState = stillAhead > 0 && stillAhead <= amberThreshold ? 'amber' : 'red'

    return { fleet: fleet!, seat: seat!, base: base!, state, retiredCount, totalInCell: total, remainingNeeded: stillAhead, isLowestSeniority: false, percentile }
  })
}

// ─── Percentile threshold calculator ─────────────────────────────────────────

export interface ThresholdResult {
  year: string
  optimistic: string | null
  pessimistic: string | null
}

export function findThresholdYear(
  baseTrajectory: TrajectoryPoint[],
  optimisticTrajectory: TrajectoryPoint[],
  pessimisticTrajectory: TrajectoryPoint[],
  targetPercentile: number,
): ThresholdResult | null {
  const firstCrossing = (traj: TrajectoryPoint[]): string | null =>
    traj.find((pt) => pt.percentile >= targetPercentile)?.date.substring(0, 4) ?? null

  const year = firstCrossing(baseTrajectory)
  if (!year) return null

  return {
    year,
    optimistic: firstCrossing(optimisticTrajectory),
    pessimistic: firstCrossing(pessimisticTrajectory),
  }
}

// ─── Upgrade transition detection ─────────────────────────────────────────────

export interface UpgradeTransition {
  employeeNumber: string
  name: string | null
  seniorityNumber: number
  type: 'upgrade' | 'fleet-change' | 'downgrade' | 'other'
  oldSeat: string | null
  newSeat: string | null
  oldFleet: string | null
  newFleet: string | null
}

export function detectUpgradeTransitions(
  olderEntries: SeniorityEntry[],
  newerEntries: SeniorityEntry[],
): UpgradeTransition[] {
  const olderByEmpNum = new Map(olderEntries.map((e) => [e.employee_number, e]))
  const transitions: UpgradeTransition[] = []

  for (const newer of newerEntries) {
    const older = olderByEmpNum.get(newer.employee_number)
    if (!older) continue

    const fleetChanged = older.fleet !== newer.fleet
    const seatChanged = older.seat !== newer.seat
    if (!fleetChanged && !seatChanged) continue

    let type: UpgradeTransition['type']
    if (fleetChanged) {
      type = 'fleet-change'
    } else if (older.seat === 'FO' && newer.seat === 'CA') {
      type = 'upgrade'
    } else if (older.seat === 'CA' && newer.seat === 'FO') {
      type = 'downgrade'
    } else {
      type = 'other'
    }

    transitions.push({
      employeeNumber: newer.employee_number,
      name: newer.name,
      seniorityNumber: newer.seniority_number,
      type,
      oldSeat: older.seat,
      newSeat: newer.seat,
      oldFleet: older.fleet,
      newFleet: newer.fleet,
    })
  }

  return transitions
}
