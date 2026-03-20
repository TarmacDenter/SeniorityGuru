import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import type { FilterFn } from '#shared/utils/seniority-math'
import type { GrowthConfig } from '#shared/types/growth-config'
import { computeAdditionalPilots } from '#shared/types/growth-config'

// Re-export TrajectoryPoint for consumers (matches buildTrajectory return shape)
export interface TrajectoryPoint {
  date: string
  rank: number
  percentile: number
}

// ─── Qual key ────────────────────────────────────────────────────────────────
// "737 CA", "320 FO" — groups analytics by fleet+seat; base is a filter dimension, not a grouping key.

export function qualKey(entry: SeniorityEntry): string {
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
  entries: readonly SeniorityEntry[],
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
  base: string
  seniorityNumber: number
  hireDate: string
  yos: number
}

export function findMostJuniorCA(entries: readonly SeniorityEntry[]): MostJuniorCARow[] {
  const byQual = new Map<string, SeniorityEntry>()
  for (const e of entries) {
    if (e.seat !== 'CA') continue
    const key = `${e.fleet}|${e.seat}|${e.base}`
    const existing = byQual.get(key)
    if (!existing || e.seniority_number > existing.seniority_number) {
      byQual.set(key, e)
    }
  }
  return Array.from(byQual.values())
    .map((e) => ({
      qualKey: `${e.fleet} ${e.seat} ${e.base}`,
      fleet: e.fleet,
      seat: e.seat,
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
  entries: readonly SeniorityEntry[],
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
  entries: readonly SeniorityEntry[],
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

export function computeQualComposition(entries: readonly SeniorityEntry[]): QualCompositionRow[] {
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
      baseCounts.set(e.base, (baseCounts.get(e.base) ?? 0) + 1)
    }
    const byBase = Array.from(baseCounts.entries())
      .map(([base, count]) => ({ base, count, pct: Math.round((count / total) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count)

    return {
      qualKey: key,
      fleet,
      seat,
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
  entries: readonly SeniorityEntry[],
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

// ─── Shared constants ─────────────────────────────────────────────────────────

export const SEAT_ORDER: Record<string, number> = { CA: 0, FO: 1 }

// ─── Power Index ──────────────────────────────────────────────────────────────

export type PowerIndexCellState = 'green' | 'amber' | 'red'

export interface PowerIndexCell {
  fleet: string
  seat: string
  base: string
  state: PowerIndexCellState
  retiredCount: number
  totalInCell: number
  pilotsAhead: number
  isLowestSeniority: boolean
  cellPercentile: number
  numbersJuniorToPlug: number
  plugPercentile: number
  userPercentile: number
}

function isActiveAt(e: SeniorityEntry, projectionDate: Date): boolean {
  if (!e.retire_date) return true
  return new Date(e.retire_date) > projectionDate
}

function lowerBound(sorted: number[], target: number): number {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (sorted[mid]! < target) lo = mid + 1
    else hi = mid
  }
  return lo
}

function sortedSenNums(entries: readonly SeniorityEntry[]): number[] {
  return entries.map((e) => e.seniority_number).sort((a, b) => a - b)
}

function companyPercentile(senNum: number, sortedNums: number[], total: number): number {
  if (total === 0) return 0
  const rank = lowerBound(sortedNums, senNum) + 1
  return Math.round(((total - rank + 1) / total) * 100 * 10) / 10
}

export function computePowerIndexCells(
  entries: readonly SeniorityEntry[],
  userSenNum: number,
  projectionDate: Date,
  growthConfig?: GrowthConfig,
): PowerIndexCell[] {
  const withQual = entries
  const activeCompany = entries.filter((e) => isActiveAt(e, projectionDate))
  const activeSorted = sortedSenNums(activeCompany)
  const totalCompany = activeCompany.length
  const additional = growthConfig?.enabled
    ? computeAdditionalPilots(entries.length, growthConfig.annualRate, new Date(), projectionDate)
    : 0
  const projectedTotalCompany = totalCompany + additional
  const userPctl = companyPercentile(userSenNum, activeSorted, projectedTotalCompany)

  const byCellKey = new Map<string, SeniorityEntry[]>()
  for (const e of withQual) {
    const key = `${e.fleet}|${e.seat}|${e.base}`
    let group = byCellKey.get(key)
    if (!group) { group = []; byCellKey.set(key, group) }
    group.push(e)
  }

  return Array.from(byCellKey.values()).map((cellEntries) => {
    const { fleet, seat, base } = cellEntries[0]!
    const total = cellEntries.length
    const remaining = cellEntries.filter((e) => isActiveAt(e, projectionDate))
    const retiredCount = total - remaining.length

    const mostJuniorActiveSenNum = remaining.length > 0
      ? Math.max(...remaining.map((e) => e.seniority_number))
      : 0

    const plugPctl = mostJuniorActiveSenNum > 0
      ? companyPercentile(mostJuniorActiveSenNum, activeSorted, projectedTotalCompany)
      : 100

    const isHoldable = remaining.length > 0 && userSenNum <= mostJuniorActiveSenNum
    const numbersJuniorToPlug = mostJuniorActiveSenNum > 0 && userSenNum > mostJuniorActiveSenNum
      ? userSenNum - mostJuniorActiveSenNum
      : 0

    const aheadInCell = remaining.filter((e) => e.seniority_number < userSenNum).length
    const cellPercentile = total > 0
      ? Math.max(0, Math.round(((total - aheadInCell) / total) * 100))
      : 0

    const isLowestSeniority = isHoldable && remaining.length > 0
      && remaining.every((e) => e.seniority_number <= userSenNum)

    let state: PowerIndexCellState
    if (isHoldable) {
      state = isLowestSeniority ? 'amber' : 'green'
    } else {
      state = numbersJuniorToPlug <= Math.ceil(total * 0.10) ? 'amber' : 'red'
    }

    return {
      fleet, seat, base, state,
      retiredCount, totalInCell: total,
      pilotsAhead: aheadInCell,
      isLowestSeniority,
      cellPercentile,
      numbersJuniorToPlug,
      plugPercentile: plugPctl,
      userPercentile: userPctl,
    }
  })
}

// ─── Qual demographic scale ──────────────────────────────────────────────────

export interface DensityBucket {
  start: number
  count: number
}

export interface QualDemographicSnapshot {
  fleet: string
  seat: string
  base: string
  activeCount: number
  plugPercentile: number
  plugSenNum: number
  p25: number
  median: number
  p75: number
  max: number
  density: DensityBucket[]
}

export interface QualDemographicScale extends QualDemographicSnapshot {
  userPercentile: number
  currentUserPercentile: number
  isHoldable: boolean
}

export function computeQualSnapshots(entries: readonly SeniorityEntry[]): QualDemographicSnapshot[] {
  const today = new Date()
  const todayActive = entries.filter((e) => isActiveAt(e, today))
  if (todayActive.length === 0) return []

  const activeSorted = sortedSenNums(todayActive)
  const totalActive = todayActive.length

  const withQual = todayActive
  const byCellKey = new Map<string, SeniorityEntry[]>()
  for (const e of withQual) {
    const key = `${e.fleet}|${e.seat}|${e.base}`
    let group = byCellKey.get(key)
    if (!group) { group = []; byCellKey.set(key, group) }
    group.push(e)
  }

  return Array.from(byCellKey.values()).map((cellEntries) => {
    const { fleet, seat, base } = cellEntries[0]!
    const pctls = cellEntries
      .map((e) => companyPercentile(e.seniority_number, activeSorted, totalActive))
      .sort((a, b) => a - b)

    const plugSenNum = Math.max(...cellEntries.map((e) => e.seniority_number))

    const BUCKET_SIZE = 5
    const bucketCounts = new Array<number>(Math.ceil(100 / BUCKET_SIZE)).fill(0)
    for (const p of pctls) {
      const idx = Math.min(Math.floor(p / BUCKET_SIZE), bucketCounts.length - 1)
      bucketCounts[idx]!++
    }
    const density: DensityBucket[] = bucketCounts.map((count, i) => ({
      start: i * BUCKET_SIZE,
      count,
    }))

    return {
      fleet,
      seat,
      base,
      activeCount: cellEntries.length,
      plugPercentile: pctls[0] ?? 0,
      plugSenNum,
      p25: percentileOf(pctls, 25),
      median: percentileOf(pctls, 50),
      p75: percentileOf(pctls, 75),
      max: pctls[pctls.length - 1] ?? 0,
      density,
    }
  })
}

export function applyProjectionToSnapshots(
  snapshots: QualDemographicSnapshot[],
  entries: readonly SeniorityEntry[],
  userSenNum: number,
  projectionDate: Date,
  growthConfig?: GrowthConfig,
): QualDemographicScale[] {
  // Use the same rank-based projection as buildTrajectory: fix total at original
  // list size and subtract retirements from rank. The previous approach (re-filter
  // to active entries, re-sort, lowerBound) kept the most junior pilot pinned at
  // the bottom regardless of retirements above them.
  const today = new Date()
  const totalPilots = entries.length
  const aheadOfUser = entries.filter(e => e.seniority_number < userSenNum)
  const initialRank = aheadOfUser.length + 1

  const retiredAheadToday = aheadOfUser.filter(e => e.retire_date && new Date(e.retire_date) <= today).length
  const currentRank = initialRank - retiredAheadToday
  const currentPctl = totalPilots > 0
    ? Math.round(((totalPilots - currentRank + 1) / totalPilots) * 100 * 10) / 10
    : 0

  const retiredAheadProjected = aheadOfUser.filter(e => e.retire_date && new Date(e.retire_date) <= projectionDate).length
  const projectedRank = initialRank - retiredAheadProjected
  const additional = growthConfig?.enabled
    ? computeAdditionalPilots(totalPilots, growthConfig.annualRate, today, projectionDate)
    : 0
  const projectedTotal = totalPilots + additional
  const userPctl = projectedTotal > 0
    ? Math.round(((projectedTotal - projectedRank + 1) / projectedTotal) * 100 * 10) / 10
    : 0

  return snapshots.map((snap) => ({
    ...snap,
    userPercentile: userPctl,
    currentUserPercentile: currentPctl,
    isHoldable: userPctl >= snap.plugPercentile,
  }))
}

// ─── Percentile threshold calculator ─────────────────────────────────────────

export interface ThresholdResult {
  year: string
}

export function findThresholdYear(
  baseTrajectory: TrajectoryPoint[],
  targetPercentile: number,
): ThresholdResult | null {
  const year = baseTrajectory.find((pt) => pt.percentile >= targetPercentile)?.date.substring(0, 4) ?? null
  if (!year) return null
  return { year }
}

// ─── Upgrade transition detection ─────────────────────────────────────────────

export interface UpgradeTransition {
  employeeNumber: string
  name: string | undefined
  seniorityNumber: number
  type: 'upgrade' | 'fleet-change' | 'downgrade' | 'other'
  oldSeat: string
  newSeat: string
  oldFleet: string
  newFleet: string
}

export function detectUpgradeTransitions(
  olderEntries: readonly SeniorityEntry[],
  newerEntries: readonly SeniorityEntry[],
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
