import type { PercentileCrossingResult, SeniorityTrajectoryPoint } from './types'

export function findPercentileCrossing(baseTrajectory: readonly SeniorityTrajectoryPoint[], targetPercentile: number): PercentileCrossingResult | null {
  const date = baseTrajectory.find(point => point.percentile >= targetPercentile)?.date
  return date ? { crossingYear: date.year } : null
}
