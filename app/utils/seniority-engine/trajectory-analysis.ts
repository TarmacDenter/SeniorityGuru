import type { PercentileCrossingResult, SeniorityTrajectoryPoint, TrajectoryChange } from './types'

export function findPercentileCrossing(baseTrajectory: readonly SeniorityTrajectoryPoint[], targetPercentile: number): PercentileCrossingResult | null {
  const date = baseTrajectory.find(point => point.percentile >= targetPercentile)?.date
  return date ? { crossingYear: date.year } : null
}

/** The first year wins a tie; non-improving trajectories have no best year. */
export function findBestTrajectoryChange(changes: readonly TrajectoryChange[]): TrajectoryChange | null {
  let best: TrajectoryChange | null = null
  for (const change of changes) {
    if (change.percentilePointChange > (best?.percentilePointChange ?? 0)) best = change
  }
  return best
}
