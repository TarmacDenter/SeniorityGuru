import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { GrowthAssumptions } from '~/utils/seniority-analysis/growth'
import { calculateAdditionalSeniorityPilots } from '~/utils/seniority-analysis/growth'
import {
  calculateSeniorityPercentile,
  calculateSeniorityTrajectory,
  calculateUnroundedSeniorityPercentile,
} from '~/utils/seniority-analysis/math'
import type { SeniorityTrajectoryPoint } from '~/utils/seniority-analysis/math'
import type {
  HoldabilityDetail,
  HoldableYear,
  NoResult,
  PercentileDensityBucket,
  Qualification,
  QualificationDistribution,
  QualificationPosition,
} from './types'
import { findPercentileCrossing } from './trajectory-analysis'
import { qualificationKey } from './qualification-key'
import { percentileValue } from './percentile-value'
import { isRetiredBy } from '~/utils/date'
import { Temporal, type PlainDate } from '~/utils/temporal'

function isActiveAt(entry: SeniorityEntry, date: PlainDate): boolean {
  return !entry.retire_date || !isRetiredBy(entry.retire_date, date)
}

function companyPercentile(seniorityNumber: number, sortedNumbers: readonly number[], rosterSize: number): number {
  let low = 0
  let high = sortedNumbers.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (sortedNumbers[middle]! < seniorityNumber) low = middle + 1
    else high = middle
  }
  return calculateSeniorityPercentile(low + 1, rosterSize)
}

const TRAJECTORY_ENDED: NoResult = {
  kind: 'no-result',
  reason: 'trajectory-ended',
  label: 'Trajectory ended before the Qualification Threshold',
}

/**
 * Holdable Year: "now" when the Anchor Pilot is senior to (or is) the threshold pilot; otherwise the first projection
 * year whose projected Seniority Percentile meets the threshold's As-of Date value. Percentiles are compared before
 * display rounding, so a pilot a few Ranks junior on a large roster is not counted as meeting the threshold.
 */
function findHoldableYear(
  entries: readonly SeniorityEntry[],
  anchorSeniorityNumber: number,
  distribution: QualificationDistribution,
  asOfDate: PlainDate,
  trajectory: readonly SeniorityTrajectoryPoint[],
  growthAssumptions?: GrowthAssumptions,
): HoldableYear {
  if (anchorSeniorityNumber <= distribution.thresholdSeniorityNumber) return 'now'
  const thresholdRank = entries.filter(entry =>
    entry.seniority_number < distribution.thresholdSeniorityNumber && isActiveAt(entry, asOfDate),
  ).length + 1
  const rosterSizeAt = (date: PlainDate) => entries.length + (growthAssumptions?.enabled
    ? calculateAdditionalSeniorityPilots(entries.length, growthAssumptions.annualGrowthRate, asOfDate, date)
    : 0)
  const unrounded = trajectory.map(point => ({
    ...point,
    percentile: calculateUnroundedSeniorityPercentile(point.rank, rosterSizeAt(point.date)),
  }))
  const target = calculateUnroundedSeniorityPercentile(thresholdRank, entries.length)
  return findPercentileCrossing(unrounded, target)?.crossingYear ?? TRAJECTORY_ENDED
}

/** The last date a projection can reach: the pilot's retirement, or the list's last scheduled retirement. */
export function projectionHorizon(entries: readonly SeniorityEntry[], retireDate: PlainDate | null | undefined, asOfDate: PlainDate): PlainDate {
  if (retireDate) return retireDate
  return entries.reduce<PlainDate>((latest, entry) =>
    entry.retire_date && Temporal.PlainDate.compare(entry.retire_date, latest) > 0 ? entry.retire_date : latest, asOfDate)
}

/** A pilot's company-wide Seniority Percentile by year from the As-of Date until they retire. */
export function companyTrajectoryThroughRetirement(
  entries: readonly SeniorityEntry[],
  seniorityNumber: number,
  asOfDate: PlainDate,
  growthAssumptions?: GrowthAssumptions,
): readonly SeniorityTrajectoryPoint[] {
  const retireDate = entries.find(entry => entry.seniority_number === seniorityNumber)?.retire_date
  return calculateSeniorityTrajectory({
    entries,
    seniorityNumber,
    from: asOfDate,
    through: projectionHorizon(entries, retireDate, asOfDate),
    growthAssumptions,
    anchorRetireDate: retireDate ?? undefined,
  }).points
}

export function analyzeQualificationDistributions(
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
      .map(entry => companyPercentile(entry.seniority_number, sortedNumbers, entries.length))
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
      rosterSize: entries.length,
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
  const trajectory = companyTrajectoryThroughRetirement(entries, anchorSeniorityNumber, asOfDate, growthAssumptions)

  return distributions.map(distribution => ({
    distribution,
    currentPercentile,
    projectedPercentile,
    modeledHoldable: projectedPercentile >= distribution.thresholdPercentile,
    holdableYear: findHoldableYear(entries, anchorSeniorityNumber, distribution, asOfDate, trajectory, growthAssumptions),
  }))
}

/**
 * The Anchor Pilot's projected company Seniority Percentile against one Qualification Threshold, with today's
 * threshold pilot projected alongside under the same Growth Assumptions. Null when the Qualification has no active pilot.
 */
export function analyzeHoldabilityDetail(
  entries: readonly SeniorityEntry[],
  anchorSeniorityNumber: number,
  asOfDate: PlainDate,
  qualification: Qualification,
  growthAssumptions?: GrowthAssumptions,
): HoldabilityDetail | null {
  const key = qualificationKey(qualification)
  const distribution = analyzeQualificationDistributions(entries, asOfDate)
    .find(candidate => qualificationKey(candidate.qualification) === key)
  if (!distribution) return null
  const anchor = companyTrajectoryThroughRetirement(entries, anchorSeniorityNumber, asOfDate, growthAssumptions)
  const thresholdPilot = new Map(
    companyTrajectoryThroughRetirement(entries, distribution.thresholdSeniorityNumber, asOfDate, growthAssumptions)
      .map(point => [point.date.toString(), point.percentile]),
  )
  return {
    qualification: distribution.qualification,
    thresholdPercentile: distribution.thresholdPercentile,
    points: anchor.map(point => ({
      date: point.date,
      anchorPercentile: point.percentile,
      thresholdPilotPercentile: thresholdPilot.get(point.date.toString()) ?? null,
    })),
  }
}
