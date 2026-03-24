import type { SeniorityEntry } from '~/utils/schemas/seniority-list';
import type { GrowthConfig } from '~/utils/growth-config';
import { computeAdditionalPilots } from '~/utils/growth-config';

type FilterFn = (entry: SeniorityEntry) => boolean;

export type { FilterFn };

export function countRetiredAbove(
  entries: readonly SeniorityEntry[],
  userSenNum: number,
  asOfDate: Date,
  filterFn?: FilterFn,
): number {
  let count = 0;
  for (const entry of entries) {
    if (entry.seniority_number >= userSenNum) continue;
    if (!entry.retire_date) continue;
    if (new Date(entry.retire_date) > asOfDate) continue;
    if (filterFn && !filterFn(entry)) continue;
    count++;
  }
  return count;
}

export function generateTimePoints(startDate: Date, endDate: Date): Date[] {
  const points: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    points.push(new Date(current));
    current.setFullYear(current.getFullYear() + 1);
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
  timePoints: Date[],
  filterFn?: FilterFn,
  growthConfig?: GrowthConfig,
): { date: string; rank: number; percentile: number; }[] {
  const filtered = filterFn ? entries.filter(filterFn) : entries;
  const totalInCategory = filtered.length;
  const aheadInCategory = filtered.filter((e) => e.seniority_number < userSenNum);
  const initialRank = aheadInCategory.length + 1;
  const baseDate = timePoints[0];

  return timePoints.map((tp) => {
    let retiredAhead = 0;
    for (const e of aheadInCategory) {
      if (!e.retire_date) continue;
      if (new Date(e.retire_date) <= tp) retiredAhead++;
    }
    const rank = initialRank - retiredAhead;
    const additional = growthConfig?.enabled && baseDate
      ? computeAdditionalPilots(totalInCategory, growthConfig.annualRate, baseDate, tp)
      : 0;
    const projectedTotal = totalInCategory + additional;
    const percentile = projectedTotal > 0
      ? Math.round(((projectedTotal - rank + 1) / projectedTotal) * 1000) / 10
      : 0;
    return {
      date: tp.toISOString().split('T')[0]!,
      rank,
      percentile,
    };
  });
}

export function computeRank(entries: readonly SeniorityEntry[], userSenNum: number): number {
  return entries.filter((e) => e.seniority_number < userSenNum).length + 1;
}

export function getProjectionEndDate(retireDate: string | null): { today: Date; endDate: Date; } {
  const today = new Date();
  const endDate = retireDate
    ? new Date(retireDate)
    : new Date(today.getFullYear() + 30, today.getMonth(), today.getDate());
  return { today, endDate };
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function projectRetirements(
  entries: readonly SeniorityEntry[],
  retireDate: string | null,
  filterFn: FilterFn = () => true,
): { labels: string[]; data: number[]; filteredTotal: number; } {
  const filteredEntries = entries.filter(filterFn);
  const filteredTotal = filteredEntries.length;

  const { today, endDate } = getProjectionEndDate(retireDate);
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
      const rd = new Date(e.retire_date);
      return rd > bucketStart && rd <= bucketEnd;
    }).length;

    labels.push(formatDateLabel(bucketEnd.toISOString().split('T')[0]!));
    data.push(count);
  }

  return { labels, data, filteredTotal };
}

export function projectComparativeTrajectory(
  allEntries: readonly SeniorityEntry[],
  userSenNum: number,
  retireDate: string | null,
  currentFilter: FilterFn,
  compareFilter: FilterFn,
  growthConfig?: GrowthConfig,
): { labels: string[]; currentData: number[]; compareData: number[]; } {
  const { endDate } = getProjectionEndDate(retireDate);
  const today = new Date();
  const timePoints = generateTimePoints(today, endDate);
  const currentTrajectory = buildTrajectory(allEntries, userSenNum, timePoints, currentFilter, growthConfig);
  const compareTrajectory = buildTrajectory(allEntries, userSenNum, timePoints, compareFilter, growthConfig);

  return {
    labels: currentTrajectory.map((t) => t.date),
    currentData: currentTrajectory.map((t) => t.percentile),
    compareData: compareTrajectory.map((t) => t.percentile),
  };
}

export interface TrajectoryDelta {
  date: string
  percentile: number
  delta: number      // YoY change in percentile points
  isPeak: boolean    // local maximum delta
}

export function computeTrajectoryDeltas(
  trajectory: { date: string; rank: number; percentile: number }[],
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

export function formatRankDelta(delta: number): string {
  if (delta === 0) return '--'
  return delta > 0 ? `+${delta}` : `${delta}`
}
