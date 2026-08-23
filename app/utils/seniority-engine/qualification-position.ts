import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { GrowthAssumptions } from '~/utils/seniority-analysis/growth'
import { calculateAdditionalSeniorityPilots } from '~/utils/seniority-analysis/growth'
import { calculateSeniorityPercentile } from '~/utils/seniority-analysis/math'
import type { PercentileDensityBucket, QualificationDistribution, QualificationPosition } from './types'
import { qualificationKey } from './qualification-key'
import { percentileValue } from './percentile-value'
import { isRetiredBy } from '~/utils/date'
import type { PlainDate } from '~/utils/temporal'

function isActiveAt(entry: SeniorityEntry, date: PlainDate): boolean {
  return !entry.retire_date || !isRetiredBy(entry.retire_date, date)
}

function companyPercentile(seniorityNumber: number, sortedNumbers: readonly number[], pilotCount: number): number {
  let low = 0
  let high = sortedNumbers.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (sortedNumbers[middle]! < seniorityNumber) low = middle + 1
    else high = middle
  }
  return calculateSeniorityPercentile(low + 1, pilotCount)
}

function analyzeQualificationDistributions(
  entries: readonly SeniorityEntry[],
  asOfDate: PlainDate,
): readonly QualificationDistribution[] {
  const activeEntries = entries.filter(entry => isActiveAt(entry, asOfDate))
  if (activeEntries.length === 0) return []
  const sortedNumbers = activeEntries.map(entry => entry.seniority_number).sort((a, b) => a - b)
  const entriesByQualification = new Map<string, SeniorityEntry[]>()
  for (const entry of activeEntries) {
    const key = qualificationKey(entry)
    const group = entriesByQualification.get(key) ?? []
    group.push(entry)
    entriesByQualification.set(key, group)
  }

  return Array.from(entriesByQualification.values()).map((qualificationEntries) => {
    const first = qualificationEntries[0]!
    const percentiles = qualificationEntries
      .map(entry => companyPercentile(entry.seniority_number, sortedNumbers, activeEntries.length))
      .sort((a, b) => a - b)
    const bucketCounts = new Array<number>(20).fill(0)
    for (const percentile of percentiles) {
      const index = Math.min(Math.floor(percentile / 5), bucketCounts.length - 1)
      bucketCounts[index] = bucketCounts[index]! + 1
    }
    const percentileDensity: PercentileDensityBucket[] = bucketCounts.map((pilotCount, index) => ({
      minimumPercentile: index * 5,
      maximumPercentile: (index + 1) * 5,
      pilotCount,
    }))
    return {
      qualification: { base: first.base, seat: first.seat, fleet: first.fleet },
      activePilotCount: qualificationEntries.length,
      thresholdPercentile: percentiles[0] ?? 0,
      thresholdSeniorityNumber: Math.max(...qualificationEntries.map(entry => entry.seniority_number)),
      percentile25: percentileValue(percentiles, 25),
      medianPercentile: percentileValue(percentiles, 50),
      percentile75: percentileValue(percentiles, 75),
      maximumPercentile: percentiles.at(-1) ?? 0,
      percentileDensity,
    }
  })
}

export function analyzeQualificationPositions(
  entries: readonly SeniorityEntry[],
  anchorSeniorityNumber: number,
  asOfDate: PlainDate,
  through: PlainDate,
  growthAssumptions?: GrowthAssumptions,
): readonly QualificationPosition[] {
  const distributions = analyzeQualificationDistributions(entries, asOfDate)
  if (distributions.length === 0) return []

  const pilotsSeniorToAnchor = entries.filter(entry => entry.seniority_number < anchorSeniorityNumber)
  const initialRank = pilotsSeniorToAnchor.length + 1
  const currentRank = initialRank - pilotsSeniorToAnchor.filter(entry =>
    entry.retire_date && isRetiredBy(entry.retire_date, asOfDate),
  ).length
  const projectedRank = initialRank - pilotsSeniorToAnchor.filter(entry =>
    entry.retire_date && isRetiredBy(entry.retire_date, through),
  ).length
  const addedPilots = growthAssumptions?.enabled
    ? calculateAdditionalSeniorityPilots(entries.length, growthAssumptions.annualGrowthRate, asOfDate, through)
    : 0
  const currentPercentile = calculateSeniorityPercentile(currentRank, entries.length)
  const projectedPercentile = calculateSeniorityPercentile(projectedRank, entries.length + addedPilots)

  return distributions.map(distribution => ({
    distribution,
    currentPercentile,
    projectedPercentile,
    modeledHoldable: projectedPercentile >= distribution.thresholdPercentile,
  }))
}
