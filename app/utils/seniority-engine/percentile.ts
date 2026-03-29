/**
 * Inverted seniority percentile: 100% = most senior (#1), 0% = most junior.
 * Rounded to one decimal place.
 */
export function computePercentile(rank: number, total: number): number {
  if (total <= 0) return 0
  return Math.round(((total - rank + 1) / total) * 1000) / 10
}
