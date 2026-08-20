/** Returns the nearest lower value at a percentile from ascending values. */
export function percentileValue(sorted: number[], percentile: number): number {
  return sorted.length === 0 ? 0 : sorted[Math.floor((percentile / 100) * (sorted.length - 1))]!
}
