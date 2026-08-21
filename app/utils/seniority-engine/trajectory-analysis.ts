import type { ThresholdResult, TrajectoryPoint } from './types'

export function findThresholdYear(baseTrajectory: (TrajectoryPoint | { date: string; rank: number; percentile: number })[], targetPercentile: number): ThresholdResult | null {
  const date = baseTrajectory.find(point => point.percentile >= targetPercentile)?.date
  const year = typeof date === 'string' ? date.slice(0, 4) : date?.year.toString()
  return year ? { year } : null
}
