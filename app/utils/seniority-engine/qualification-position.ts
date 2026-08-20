import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { DensityBucket, GrowthConfig, QualDemographicScale, QualDemographicSnapshot } from './types'
import { computeAdditionalPilots } from '~/utils/growth-config'
import { computePercentile } from './percentile'
import { cellKey } from './cell-key'
import { percentileValue } from './percentile-value'
import { isRetiredBy } from '~/utils/date'
import type { PlainDate } from '~/utils/temporal'

function isActiveAt(entry: SeniorityEntry, date: PlainDate): boolean {
  return !entry.retire_date || !isRetiredBy(entry.retire_date, date)
}

function companyPercentile(seniorityNumber: number, sortedNumbers: number[], total: number): number {
  if (total === 0) return 0
  let low = 0
  let high = sortedNumbers.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (sortedNumbers[middle]! < seniorityNumber) low = middle + 1
    else high = middle
  }
  return computePercentile(low + 1, total)
}

export function computeQualSnapshots(entries: readonly SeniorityEntry[], asOfDate: PlainDate): QualDemographicSnapshot[] {
  const activeEntries = entries.filter(entry => isActiveAt(entry, asOfDate))
  if (activeEntries.length === 0) return []
  const sortedNumbers = activeEntries.map(entry => entry.seniority_number).sort((a, b) => a - b)
  const byCell = new Map<string, SeniorityEntry[]>()
  for (const entry of activeEntries) {
    const key = cellKey(entry)
    const group = byCell.get(key) ?? []
    group.push(entry)
    byCell.set(key, group)
  }
  return Array.from(byCell.values()).map(cellEntries => {
    const { fleet, seat, base } = cellEntries[0]!
    const percentiles = cellEntries.map(entry => companyPercentile(entry.seniority_number, sortedNumbers, activeEntries.length)).sort((a, b) => a - b)
    const bucketCounts = new Array<number>(20).fill(0)
    for (const percentile of percentiles) bucketCounts[Math.min(Math.floor(percentile / 5), bucketCounts.length - 1)]!++
    const density: DensityBucket[] = bucketCounts.map((count, index) => ({ start: index * 5, count }))
    return { fleet, seat, base, activeCount: cellEntries.length, plugPercentile: percentiles[0] ?? 0, plugSenNum: Math.max(...cellEntries.map(entry => entry.seniority_number)), p25: percentileValue(percentiles, 25), median: percentileValue(percentiles, 50), p75: percentileValue(percentiles, 75), max: percentiles[percentiles.length - 1] ?? 0, density }
  })
}

export function applyProjectionToSnapshots(snapshots: QualDemographicSnapshot[], entries: readonly SeniorityEntry[], userSeniorityNumber: number, projectionDate: PlainDate, growthConfig: GrowthConfig | undefined, asOfDate: PlainDate): QualDemographicScale[] {
  const ahead = entries.filter(entry => entry.seniority_number < userSeniorityNumber)
  const initialRank = ahead.length + 1
  const currentRank = initialRank - ahead.filter(entry => entry.retire_date && isRetiredBy(entry.retire_date, asOfDate)).length
  const projectedRank = initialRank - ahead.filter(entry => entry.retire_date && isRetiredBy(entry.retire_date, projectionDate)).length
  const addedPilots = growthConfig?.enabled ? computeAdditionalPilots(entries.length, growthConfig.annualRate, asOfDate, projectionDate) : 0
  const currentUserPercentile = computePercentile(currentRank, entries.length)
  const userPercentile = computePercentile(projectedRank, entries.length + addedPilots)
  return snapshots.map(snapshot => ({ ...snapshot, userPercentile, currentUserPercentile, isHoldable: userPercentile >= snapshot.plugPercentile }))
}
