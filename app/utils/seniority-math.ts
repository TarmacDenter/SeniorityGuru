import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { FilterFn, GrowthConfig, TrajectoryDelta } from '~/utils/seniority-engine/types'
import { computeAdditionalPilots } from '~/utils/growth-config'
import { computePercentile } from '~/utils/seniority-engine/percentile'
import { addYearsDate, formatMonthYear, isRetiredBy } from '~/utils/date'
import { Temporal, type PlainDate } from '~/utils/temporal'

export type { FilterFn }

export function countRetiredAbove(
  entries: readonly SeniorityEntry[],
  userSenNum: number,
  asOfDate: PlainDate,
  filterFn?: FilterFn,
): number {
  let count = 0;
  for (const entry of entries) {
    if (entry.seniority_number >= userSenNum) continue;
    if (!entry.retire_date) continue;
    if (!isRetiredBy(entry.retire_date, asOfDate)) continue;
    if (filterFn && !filterFn(entry)) continue;
    count++;
  }
  return count;
}

export function generateTimePoints(startDate: PlainDate, endDate: PlainDate): PlainDate[] {
  const points: PlainDate[] = []
  let current = startDate
  while (Temporal.PlainDate.compare(current, endDate) <= 0) {
    points.push(current)
    current = addYearsDate(current, 1);
  }
  return points;
}

/**
 * For each time point, compute rank within the (optionally filtered) set.
 * Percentile is inverted: 100% = most senior (#1), 0% = most junior.
 */
export function buildTrajectory(
  entries: readonly SeniorityEntry[],
  userSenNum: number,
  timePoints: PlainDate[],
  filterFn?: FilterFn,
  growthConfig?: GrowthConfig,
): { date: PlainDate; rank: number; percentile: number; }[] {
  const filtered = filterFn ? entries.filter(filterFn) : entries;
  const totalInCategory = filtered.length;
  const aheadInCategory = filtered.filter((e) => e.seniority_number < userSenNum);
  const initialRank = aheadInCategory.length + 1;
  const baseDate = timePoints[0]

  return timePoints.map((tp) => {
    const pointDate = tp
    let retiredAhead = 0;
    for (const e of aheadInCategory) {
      if (!e.retire_date) continue;
      if (isRetiredBy(e.retire_date, tp)) retiredAhead++;
    }
    const rank = initialRank - retiredAhead;
    const additional = growthConfig?.enabled && baseDate
      ? computeAdditionalPilots(totalInCategory, growthConfig.annualRate, baseDate, pointDate)
      : 0;
    const projectedTotal = totalInCategory + additional;
    return {
      date: pointDate,
      rank,
      percentile: computePercentile(rank, projectedTotal),
    };
  });
}

export function computeRank(entries: readonly SeniorityEntry[], userSenNum: number): number {
  return entries.filter((e) => e.seniority_number < userSenNum).length + 1;
}

/** Legacy serialized seam retained for chart callers during migration. */
export function getProjectionEndDate(retireDate: PlainDate | null, asOfDate: PlainDate): { today: string; endDate: string } {
  const today = asOfDate
  return {
    today: today.toString(),
    endDate: (retireDate ? Temporal.PlainDate.from(retireDate) : addYearsDate(today, 30)).toString(),
  }
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function projectRetirements(
  entries: readonly SeniorityEntry[],
  retireDate: PlainDate | null,
  asOfDate: PlainDate,
  filterFn?: FilterFn,
): { labels: string[]; data: number[]; filteredTotal: number; } {
  const filteredEntries = entries.filter(filterFn ?? (() => true));
  const filteredTotal = filteredEntries.length;

  const { today, endDate } = getProjectionEndDateValue(retireDate, asOfDate)
  const timePoints = generateTimePoints(today, endDate);
  if (timePoints.length === 0) {
    return { labels: [], data: [], filteredTotal };
  }

  const labels: string[] = [];
  const data: number[] = [];

  for (let i = 0; i < timePoints.length; i++) {
    const bucketStart = i === 0 ? today : timePoints[i - 1]!;
    const bucketEnd = timePoints[i]!;

    const count = filteredEntries.filter((e) => {
      if (!e.retire_date) return false;
      return !isRetiredBy(e.retire_date, bucketStart) && isRetiredBy(e.retire_date, bucketEnd);
    }).length;

    labels.push(formatMonthYear(bucketEnd));
    data.push(count);
  }

  return { labels, data, filteredTotal };
}

export function projectComparativeTrajectory(
  allEntries: readonly SeniorityEntry[],
  userSenNum: number,
  retireDate: PlainDate | null,
  asOfDate: PlainDate,
  currentFilter: FilterFn,
  compareFilter: FilterFn,
  growthConfig?: GrowthConfig,
): { labels: string[]; currentData: number[]; compareData: number[]; } {
  const { today, endDate } = getProjectionEndDateValue(retireDate, asOfDate)
  const timePoints = generateTimePoints(today, endDate);
  const currentTrajectory = buildTrajectory(allEntries, userSenNum, timePoints, currentFilter, growthConfig);
  const compareTrajectory = buildTrajectory(allEntries, userSenNum, timePoints, compareFilter, growthConfig);

  return {
    labels: currentTrajectory.map((t) => t.date.toString()),
    currentData: currentTrajectory.map((t) => t.percentile),
    compareData: compareTrajectory.map((t) => t.percentile),
  };
}

export type { TrajectoryDelta }

export function computeTrajectoryDeltas(trajectory: { date: PlainDate; rank: number; percentile: number }[]): TrajectoryDelta[]
export function computeTrajectoryDeltas(
  trajectory: { date: PlainDate; rank: number; percentile: number }[],
): TrajectoryDelta[] {
  if (trajectory.length < 2) return []
  const deltas: TrajectoryDelta[] = []
  for (let i = 1; i < trajectory.length; i++) {
    const delta = Math.round((trajectory[i]!.percentile - trajectory[i - 1]!.percentile) * 10) / 10
    deltas.push({
      date: trajectory[i]!.date,
      percentile: trajectory[i]!.percentile,
      delta,
      isPeak: false,
    })
  }
  for (let i = 0; i < deltas.length; i++) {
    const prev = i > 0 ? deltas[i - 1]!.delta : -Infinity
    const next = i < deltas.length - 1 ? deltas[i + 1]!.delta : -Infinity
    if (deltas[i]!.delta > prev && deltas[i]!.delta > next && deltas[i]!.delta > 0) {
      deltas[i]!.isPeak = true
    }
  }
  return deltas
}

export function getProjectionEndDateValue(retireDate: PlainDate | null, asOfDate: PlainDate): { today: PlainDate; endDate: PlainDate } {
  return { today: asOfDate, endDate: retireDate ?? addYearsDate(asOfDate, 30) }
}

export function formatRankDelta(delta: number): string {
  if (delta === 0) return '--'
  return delta > 0 ? `+${delta}` : `${delta}`
}
