import type {
  PercentileCrossingResult,
  Qualification,
  QualificationPosition,
  QualificationScope,
  SeniorityDemographics,
} from '~/utils/seniority-engine/types'
import type {
  RetirementCountProjection,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
  TrajectoryChange,
} from './math'
import { formatMonthYear } from '~/utils/date'

export interface PresentedTrajectoryChange extends TrajectoryChange {
  readonly isPeak: boolean
}

export interface PresentedSeniorityTrajectory {
  chartData: { labels: string[]; data: number[] }
  changes: PresentedTrajectoryChange[]
}

export interface PresentedSeniorityTrajectoryComparison {
  labels: string[]
  baselineData: number[]
  comparisonData: number[]
}

export interface PresentedRetirementCountProjection {
  labels: string[]
  data: number[]
  scopedPilotCount: number
}

export function presentSeniorityTrajectory(trajectory: SeniorityTrajectory): PresentedSeniorityTrajectory {
  const changes = trajectory.changes.map((change, index, all): PresentedTrajectoryChange => {
    const previous = index > 0 ? all[index - 1]!.percentilePointChange : -Infinity
    const next = index < all.length - 1 ? all[index + 1]!.percentilePointChange : -Infinity
    return {
      ...change,
      isPeak:
        change.percentilePointChange > 0
        && change.percentilePointChange > previous
        && change.percentilePointChange > next,
    }
  })
  return {
    chartData: {
      labels: trajectory.points.map(point => point.date.toString()),
      data: trajectory.points.map(point => point.percentile),
    },
    changes,
  }
}

export function presentSeniorityTrajectoryComparison(
  comparison: SeniorityTrajectoryComparison,
): PresentedSeniorityTrajectoryComparison {
  return {
    labels: comparison.points.map(point => point.date.toString()),
    baselineData: comparison.points.map(point => point.baselinePercentile),
    comparisonData: comparison.points.map(point => point.comparisonPercentile),
  }
}

export function presentRetirementCountProjection(
  projection: RetirementCountProjection,
): PresentedRetirementCountProjection {
  return {
    labels: projection.buckets.map(bucket => formatMonthYear(bucket.through)),
    data: projection.buckets.map(bucket => bucket.retirementCount),
    scopedPilotCount: projection.scopedPilotCount,
  }
}

export function formatQualification(qualification: Qualification): string {
  return `${qualification.seat}/${qualification.fleet}/${qualification.base}`
}

export function formatQualificationScope(scope: QualificationScope): string {
  const parts = [scope.base, scope.seat, scope.fleet].filter((part): part is string => !!part)
  return parts.length === 0 ? 'Company-wide' : parts.join(' ')
}

export function formatSeniorityCount(value: number): string {
  return value.toLocaleString()
}

export function formatSeniorityRankChange(value: number): string {
  if (value === 0) return '--'
  return value > 0 ? `+${value}` : String(value)
}

export function presentPercentileCrossing(result: PercentileCrossingResult | null): { year: string } | null {
  return result ? { year: String(result.crossingYear) } : null
}

export function presentAgeBucket(bucket: SeniorityDemographics['ageDistribution']['buckets'][number]) {
  const label = bucket.maximumAge === undefined
    ? `${bucket.minimumAge}+`
    : bucket.minimumAge === 0
      ? `< ${bucket.maximumAge + 1}`
      : `${bucket.minimumAge}–${bucket.maximumAge}`
  return { label, count: bucket.pilotCount }
}

export function presentSeniorityDemographics(demographics: SeniorityDemographics) {
  return {
    ageDistribution: {
      buckets: demographics.ageDistribution.buckets.map(presentAgeBucket),
      nullCount: demographics.ageDistribution.unknownAgePilotCount,
    },
    yearsOfServiceDistribution: {
      entryFloor: demographics.yearsOfServiceDistribution.entryFloor,
      p10: demographics.yearsOfServiceDistribution.p10,
      p25: demographics.yearsOfServiceDistribution.p25,
      median: demographics.yearsOfServiceDistribution.median,
      p75: demographics.yearsOfServiceDistribution.p75,
      p90: demographics.yearsOfServiceDistribution.p90,
      max: demographics.yearsOfServiceDistribution.maximum,
    },
    yearsOfServiceBuckets: demographics.yearsOfServiceBuckets.map(bucket => ({
      label: String(bucket.minimumYears),
      minYos: bucket.minimumYears,
      count: bucket.pilotCount,
    })),
    qualificationComposition: demographics.qualificationComposition.map(composition => ({
      qualificationLabel: `${composition.fleet} ${composition.seat}`,
      fleet: composition.fleet,
      seat: composition.seat,
      total: composition.pilotCount,
      caCount: composition.captainCount,
      foCount: composition.firstOfficerCount,
      caFoRatio: composition.captainToFirstOfficerRatio,
      byBase: composition.byBase.map(base => ({
        base: base.base,
        count: base.pilotCount,
        pct: base.percentage,
      })),
    })),
    captainQualificationThresholds: demographics.captainQualificationThresholds.map(threshold => ({
      qualificationLabel: `${threshold.qualification.fleet} ${threshold.qualification.seat} ${threshold.qualification.base}`,
      fleet: threshold.qualification.fleet,
      seat: threshold.qualification.seat,
      base: threshold.qualification.base,
      seniorityNumber: threshold.seniorityNumber,
      hireDate: threshold.hireDate,
      yos: threshold.yearsOfService,
    })),
  }
}

export interface PresentedQualificationPosition {
  readonly qualification: Qualification
  readonly activePilotCount: number
  readonly thresholdPercentile: number
  readonly thresholdSeniorityNumber: number
  readonly percentile25: number
  readonly medianPercentile: number
  readonly percentile75: number
  readonly maximumPercentile: number
  readonly percentileDensity: readonly {
    readonly minimumPercentile: number
    readonly maximumPercentile: number
    readonly pilotCount: number
  }[]
  readonly currentPercentile: number
  readonly projectedPercentile: number
  readonly modeledHoldable: boolean
}

export function presentQualificationPositions(
  positions: readonly QualificationPosition[],
): PresentedQualificationPosition[] {
  return positions.map(position => ({
    ...position.distribution,
    currentPercentile: position.currentPercentile,
    projectedPercentile: position.projectedPercentile,
    modeledHoldable: position.modeledHoldable,
  }))
}
