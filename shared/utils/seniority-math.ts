import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list';

type FilterFn = (entry: SeniorityEntryResponse) => boolean;

export type { FilterFn };

/**
 * Count entries senior to user (lower seniority_number) that have retired by asOfDate.
 */
export function countRetiredAbove(
  entries: SeniorityEntryResponse[],
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

/** Generate yearly time points from startDate through endDate. */
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
 * Build trajectory: for each time point, compute rank within the (optionally filtered) set.
 * Rank = number of non-retired pilots ahead of user + 1.
 * Percentile is inverted: 100% = most senior (#1), 0% = most junior.
 */
export function buildTrajectory(
  entries: SeniorityEntryResponse[],
  userSenNum: number,
  timePoints: Date[],
  filterFn?: FilterFn,
): { date: string; rank: number; percentile: number; }[] {
  const filtered = filterFn ? entries.filter(filterFn) : entries;
  const totalInCategory = filtered.length;
  const aheadInCategory = filtered.filter((e) => e.seniority_number < userSenNum);
  const initialRank = aheadInCategory.length + 1;

  return timePoints.map((tp) => {
    let retiredAhead = 0;
    for (const e of aheadInCategory) {
      if (!e.retire_date) continue;
      if (new Date(e.retire_date) <= tp) retiredAhead++;
    }
    const rank = initialRank - retiredAhead;
    const percentile = totalInCategory > 0
      ? Math.round(((totalInCategory - rank + 1) / totalInCategory) * 1000) / 10
      : 0;
    return {
      date: tp.toISOString().split('T')[0]!,
      rank,
      percentile,
    };
  });
}

/** Compute raw rank: number of entries with lower seniority_number + 1 */
export function computeRank(entries: SeniorityEntryResponse[], userSenNum: number): number {
  return entries.filter((e) => e.seniority_number < userSenNum).length + 1;
}

/** Get projection end date from a retire_date string, or default to 30 years from today. */
export function getProjectionEndDate(retireDate: string | null): { today: Date; endDate: Date; } {
  const today = new Date();
  const endDate = retireDate
    ? new Date(retireDate)
    : new Date(today.getFullYear() + 30, today.getMonth(), today.getDate());
  return { today, endDate };
}

/** Format a date string (YYYY-MM-DD) to "Mon YYYY" display format. */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Format a number with locale separators */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Bucket retirements into yearly intervals from today to the projection end date.
 * When retireDate is null, falls back to a 30-year window.
 */
export function projectRetirements(
  entries: SeniorityEntryResponse[],
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

/**
 * Build two trajectories (current and compare) for a given user seniority number.
 */
export function projectComparativeTrajectory(
  allEntries: SeniorityEntryResponse[],
  userSenNum: number,
  retireDate: string | null,
  currentFilter: FilterFn,
  compareFilter: FilterFn,
): { labels: string[]; currentData: number[]; compareData: number[]; } {
  const { endDate } = getProjectionEndDate(retireDate);
  const today = new Date();
  const timePoints = generateTimePoints(today, endDate);
  const currentTrajectory = buildTrajectory(allEntries, userSenNum, timePoints, currentFilter);
  const compareTrajectory = buildTrajectory(allEntries, userSenNum, timePoints, compareFilter);

  return {
    labels: currentTrajectory.map((t) => t.date),
    currentData: currentTrajectory.map((t) => t.percentile),
    compareData: compareTrajectory.map((t) => t.percentile),
  };
}
