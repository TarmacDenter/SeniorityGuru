import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { addYearsDate, isRetiredBy } from '~/utils/date'
import { Temporal, type PlainDate } from '~/utils/temporal'
import { calculateAdditionalSeniorityPilots, type GrowthAssumptions } from './growth'

export type EntryPredicate = (entry: SeniorityEntry) => boolean

export interface SeniorityTrajectoryPoint {
  readonly date: PlainDate
  readonly rank: number
  readonly percentile: number
}

export interface TrajectoryChange {
  readonly date: PlainDate
  readonly percentile: number
  readonly percentilePointChange: number
}

export interface SeniorityTrajectory {
  readonly points: readonly SeniorityTrajectoryPoint[]
  readonly changes: readonly TrajectoryChange[]
}

export interface SeniorityTrajectoryComparisonPoint {
  readonly date: PlainDate
  readonly baselinePercentile: number
  readonly comparisonPercentile: number
}

export interface SeniorityTrajectoryComparison {
  readonly points: readonly SeniorityTrajectoryComparisonPoint[]
}

export interface RetirementCountBucket {
  readonly through: PlainDate
  readonly retirementCount: number
}

export interface RetirementCountProjection {
  readonly buckets: readonly RetirementCountBucket[]
  readonly scopedPilotCount: number
}

export interface CalculateSeniorityTrajectoryOptions {
  readonly entries: readonly SeniorityEntry[]
  readonly seniorityNumber: number
  readonly from: PlainDate
  readonly through: PlainDate
  readonly predicate?: EntryPredicate
  readonly growthAssumptions?: GrowthAssumptions
}

export interface CalculateSeniorityTrajectoryComparisonOptions {
  readonly entries: readonly SeniorityEntry[]
  readonly seniorityNumber: number
  readonly from: PlainDate
  readonly through: PlainDate
  readonly baselinePredicate: EntryPredicate
  readonly comparisonPredicate: EntryPredicate
  readonly baselineGrowthAssumptions?: GrowthAssumptions
  readonly comparisonGrowthAssumptions?: GrowthAssumptions
}

export interface CalculateRetirementCountProjectionOptions {
  readonly entries: readonly SeniorityEntry[]
  readonly from: PlainDate
  readonly through: PlainDate
  readonly predicate?: EntryPredicate
}

/** Returns an inverted percentile where 100 is most senior. */
export function calculateSeniorityPercentile(rank: number, pilotCount: number): number {
  if (pilotCount <= 0) return 0
  return Math.round(((pilotCount - rank + 1) / pilotCount) * 1000) / 10
}

/** Calculates one-based Rank from collection membership. */
export function calculateSeniorityRank(entries: readonly SeniorityEntry[], seniorityNumber: number): number {
  return entries.filter(entry => entry.seniority_number < seniorityNumber).length + 1
}

export function countRetiredPilotsSeniorTo(
  entries: readonly SeniorityEntry[],
  seniorityNumber: number,
  asOfDate: PlainDate,
  predicate?: EntryPredicate,
): number {
  return entries.filter(entry =>
    entry.seniority_number < seniorityNumber
    && !!entry.retire_date
    && isRetiredBy(entry.retire_date, asOfDate)
    && (!predicate || predicate(entry)),
  ).length
}

/** Generates annual samples from `from` through the inclusive bound. */
export function generateAnnualSeniorityDates(from: PlainDate, through: PlainDate): readonly PlainDate[] {
  const dates: PlainDate[] = []
  for (let date = from; Temporal.PlainDate.compare(date, through) <= 0; date = addYearsDate(date, 1)) {
    dates.push(date)
  }
  return dates
}

function calculateTrajectoryPoints(options: CalculateSeniorityTrajectoryOptions): SeniorityTrajectoryPoint[] {
  const filteredEntries = options.predicate ? options.entries.filter(options.predicate) : [...options.entries]
  const pilotsSeniorToAnchor = filteredEntries.filter(entry => entry.seniority_number < options.seniorityNumber)
  const initialRank = pilotsSeniorToAnchor.length + 1

  return generateAnnualSeniorityDates(options.from, options.through).map((date) => {
    const retiredSeniorPilots = pilotsSeniorToAnchor.filter(entry => entry.retire_date && isRetiredBy(entry.retire_date, date)).length
    const rank = initialRank - retiredSeniorPilots
    const addedPilots = options.growthAssumptions?.enabled
      ? calculateAdditionalSeniorityPilots(filteredEntries.length, options.growthAssumptions.annualGrowthRate, options.from, date)
      : 0
    return {
      date,
      rank,
      percentile: calculateSeniorityPercentile(rank, filteredEntries.length + addedPilots),
    }
  })
}

export function calculateTrajectoryChanges(points: readonly SeniorityTrajectoryPoint[]): readonly TrajectoryChange[] {
  return points.slice(1).map((point, index) => ({
    date: point.date,
    percentile: point.percentile,
    percentilePointChange: Math.round((point.percentile - points[index]!.percentile) * 10) / 10,
  }))
}

export function calculateSeniorityTrajectory(options: CalculateSeniorityTrajectoryOptions): SeniorityTrajectory {
  const points = calculateTrajectoryPoints(options)
  return { points, changes: calculateTrajectoryChanges(points) }
}

export function calculateSeniorityTrajectoryComparison(
  options: CalculateSeniorityTrajectoryComparisonOptions,
): SeniorityTrajectoryComparison {
  const baseline = calculateTrajectoryPoints({
    ...options,
    predicate: options.baselinePredicate,
    growthAssumptions: options.baselineGrowthAssumptions,
  })
  const comparison = calculateTrajectoryPoints({
    ...options,
    predicate: options.comparisonPredicate,
    growthAssumptions: options.comparisonGrowthAssumptions,
  })
  return {
    points: baseline.map((point, index) => ({
      date: point.date,
      baselinePercentile: point.percentile,
      comparisonPercentile: comparison[index]!.percentile,
    })),
  }
}

export function calculateRetirementCountProjection(
  options: CalculateRetirementCountProjectionOptions,
): RetirementCountProjection {
  const scopedEntries = options.predicate ? options.entries.filter(options.predicate) : [...options.entries]
  const dates = generateAnnualSeniorityDates(options.from, options.through)
  const buckets = dates.map((through, index): RetirementCountBucket => {
    const bucketStart = index === 0 ? options.from : dates[index - 1]!
    const retirementCount = scopedEntries.filter(entry =>
      !!entry.retire_date
      && !isRetiredBy(entry.retire_date, bucketStart)
      && isRetiredBy(entry.retire_date, through),
    ).length
    return { through, retirementCount }
  })
  return { buckets, scopedPilotCount: scopedEntries.length }
}
