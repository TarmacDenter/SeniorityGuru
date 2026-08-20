import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { DensityBucket, GrowthConfig, QualDemographicScale, QualDemographicSnapshot, ThresholdResult, TrajectoryPoint } from '~/utils/seniority-engine/types'
import { computeAdditionalPilots } from '~/utils/growth-config'
import { computePercentile } from '~/utils/seniority-engine/percentile'
import { cellKey } from '~/utils/seniority-engine/cell-key'
import { isRetiredBy } from '~/utils/date'
import type { PlainDate } from '~/utils/temporal'

export type { DensityBucket, QualDemographicScale, QualDemographicSnapshot, ThresholdResult, TrajectoryPoint }

function percentileOf(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0
  return sorted[Math.floor((percentile / 100) * (sorted.length - 1))]!
}

function isActiveAt(entry: SeniorityEntry, projectionDate: PlainDate): boolean {
  return !entry.retire_date || !isRetiredBy(entry.retire_date, projectionDate)
}

function lowerBound(sorted: number[], target: number): number {
  let low = 0
  let high = sorted.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (sorted[middle]! < target) low = middle + 1
    else high = middle
  }
  return low
}

function sortedSenNums(entries: readonly SeniorityEntry[]): number[] {
  return entries.map(entry => entry.seniority_number).sort((a, b) => a - b)
}

function companyPercentile(seniorityNumber: number, sortedNumbers: number[], total: number): number {
  return total === 0 ? 0 : computePercentile(lowerBound(sortedNumbers, seniorityNumber) + 1, total)
}

export function computeQualSnapshots(entries: readonly SeniorityEntry[], asOfDate: PlainDate): QualDemographicSnapshot[] {
  const activeEntries = entries.filter(entry => isActiveAt(entry, asOfDate))
  if (activeEntries.length === 0) return []
  const activeSorted = sortedSenNums(activeEntries)
  const byCell = new Map<string, SeniorityEntry[]>()
  for (const entry of activeEntries) {
    const key = cellKey(entry)
    const group = byCell.get(key) ?? []
    group.push(entry)
    byCell.set(key, group)
  }
  return Array.from(byCell.values()).map(cellEntries => {
    const { fleet, seat, base } = cellEntries[0]!
    const percentiles = cellEntries.map(entry => companyPercentile(entry.seniority_number, activeSorted, activeEntries.length)).sort((a, b) => a - b)
    const bucketSize = 5
    const bucketCounts = new Array<number>(Math.ceil(100 / bucketSize)).fill(0)
    for (const percentile of percentiles) bucketCounts[Math.min(Math.floor(percentile / bucketSize), bucketCounts.length - 1)]!++
    const density: DensityBucket[] = bucketCounts.map((count, index) => ({ start: index * bucketSize, count }))
    return { fleet, seat, base, activeCount: cellEntries.length, plugPercentile: percentiles[0] ?? 0, plugSenNum: Math.max(...cellEntries.map(entry => entry.seniority_number)), p25: percentileOf(percentiles, 25), median: percentileOf(percentiles, 50), p75: percentileOf(percentiles, 75), max: percentiles[percentiles.length - 1] ?? 0, density }
  })
}

export function applyProjectionToSnapshots(snapshots: QualDemographicSnapshot[], entries: readonly SeniorityEntry[], userSenNum: number, projectionDate: PlainDate, growthConfig: GrowthConfig | undefined, asOfDate: PlainDate): QualDemographicScale[] {
  const aheadOfUser = entries.filter(entry => entry.seniority_number < userSenNum)
  const initialRank = aheadOfUser.length + 1
  const currentRank = initialRank - aheadOfUser.filter(entry => entry.retire_date && isRetiredBy(entry.retire_date, asOfDate)).length
  const projectedRank = initialRank - aheadOfUser.filter(entry => entry.retire_date && isRetiredBy(entry.retire_date, projectionDate)).length
  const additionalPilots = growthConfig?.enabled ? computeAdditionalPilots(entries.length, growthConfig.annualRate, asOfDate, projectionDate) : 0
  const currentUserPercentile = computePercentile(currentRank, entries.length)
  const userPercentile = computePercentile(projectedRank, entries.length + additionalPilots)
  return snapshots.map(snapshot => ({ ...snapshot, userPercentile, currentUserPercentile, isHoldable: userPercentile >= snapshot.plugPercentile }))
}

export function findThresholdYear(baseTrajectory: (TrajectoryPoint | { date: string; rank: number; percentile: number })[], targetPercentile: number): ThresholdResult | null {
  const date = baseTrajectory.find(point => point.percentile >= targetPercentile)?.date
  const year = typeof date === 'string' ? date.slice(0, 4) : date?.year.toString()
  return year ? { year } : null
}
