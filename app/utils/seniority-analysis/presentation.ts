import type {
  PercentileCrossingResult,
  Qualification,
  QualificationPosition,
  QualificationScope,
  SeniorityDemographics,
  SeniorityStanding,
} from '~/utils/seniority-engine/types'
import type { QualificationViewerAnalysis, QualificationViewerEntry } from '~/utils/seniority-engine/qual-viewer'
import type { PlainDate } from '~/utils/temporal'
import type {
  RetirementCountProjection,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
  TrajectoryChange,
} from './math'
import { diffYears, formatMonthYear } from '~/utils/date'

export type QualificationViewerRetirementTimeline = 'past' | 'imminent' | 'soon' | null

export interface PresentedQualificationViewerEntry extends QualificationViewerEntry {
  readonly retirementTimeline: QualificationViewerRetirementTimeline
}

export interface PresentedQualificationViewerAnalysis extends Omit<QualificationViewerAnalysis, 'entries'> {
  readonly entries: readonly PresentedQualificationViewerEntry[]
}

export function presentSeniorityQualificationViewer(
  analysis: QualificationViewerAnalysis,
  asOfDate: PlainDate,
): PresentedQualificationViewerAnalysis {
  return {
    ...analysis,
    entries: analysis.entries.map((entry) => {
      if (!entry.retirementDate) return { ...entry, retirementTimeline: null }
      const days = diffYears(asOfDate.toString(), entry.retirementDate.toString()) * 365.25
      const retirementTimeline = days < 0
        ? 'past'
        : days <= 180
          ? 'imminent'
          : days <= 365
            ? 'soon'
            : null
      return { ...entry, retirementTimeline }
    }),
  }
}

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

export function presentSeniorityStanding(standing: SeniorityStanding) {
  return {
    ...standing,
    rollingNext12MonthRetirementsLabel: formatSeniorityCount(standing.rollingNext12MonthRetirements),
    qualificationStandings: standing.qualificationStandings.map(item => ({
      ...item,
      qualificationLabel: formatQualification(item.qualification),
    })),
  }
}

export type PresentedSeniorityStanding = ReturnType<typeof presentSeniorityStanding>

export function presentPercentileCrossing(result: PercentileCrossingResult | null): { year: string } | null {
  return result ? { year: String(result.crossingYear) } : null
}

export type PresentedPercentileCrossing = ReturnType<typeof presentPercentileCrossing>

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
      modeledHoldable: false,
    })),
  }
}

export type PresentedSeniorityDemographics = ReturnType<typeof presentSeniorityDemographics>

export function presentAnchoredSeniorityDemographics(
  demographics: SeniorityDemographics,
  positions: readonly QualificationPosition[],
): PresentedSeniorityDemographics {
  const presented = presentSeniorityDemographics(demographics)
  return {
    ...presented,
    captainQualificationThresholds: presented.captainQualificationThresholds.map((threshold) => {
      const position = positions.find(candidate =>
        candidate.distribution.qualification.base === threshold.base
        && candidate.distribution.qualification.seat === threshold.seat
        && candidate.distribution.qualification.fleet === threshold.fleet,
      )
      return { ...threshold, modeledHoldable: position?.modeledHoldable ?? false }
    }),
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
