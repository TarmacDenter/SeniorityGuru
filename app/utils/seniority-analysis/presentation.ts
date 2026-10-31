import type {
  NoResult,
  PercentileCrossingResult,
  Qualification,
  QualificationPosition,
  QualificationScope,
  SeniorityDemographics,
  SeniorityStanding,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
} from '~/utils/seniority-engine/types'
import type { QualificationViewerAnalysis, QualificationViewerEntry } from '~/utils/seniority-engine/qual-viewer'
import { isNoResult } from '~/utils/seniority-engine/types'
import type { PlainDate } from '~/utils/temporal'
import type { RetirementCountProjection, TrajectoryChange } from './math'
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

export interface PresentedSeniorityTrajectoryValue {
  chartData: { labels: string[]; data: number[] }
  changes: PresentedTrajectoryChange[]
  /** Reason the samples stopped early, such as "Anchor Pilot retired". */
  endedByLabel: string | null
  /** "Hypothetical Placement in <scope>" when the Anchor Pilot is outside the scope; otherwise null. */
  hypotheticalLabel: string | null
}

export type PresentedSeniorityTrajectory = PresentedSeniorityTrajectoryValue | NoResult

export interface PresentedSeniorityTrajectoryComparisonValue {
  labels: string[]
  baselineData: number[]
  comparisonData: number[]
  endedByLabel: string | null
  baselineHypotheticalLabel: string | null
  comparisonHypotheticalLabel: string | null
}

export type PresentedSeniorityTrajectoryComparison = PresentedSeniorityTrajectoryComparisonValue | NoResult

export interface PresentedRetirementCountProjection {
  labels: string[]
  data: number[]
  scopedPilotCount: number
}

/** Names the scope the Anchor Pilot is placed into when outside it; null for a member. */
export function hypotheticalPlacementLabel(isHypothetical: boolean, scope: QualificationScope): string | null {
  return isHypothetical ? `Hypothetical Placement in ${formatQualificationScope(scope)}` : null
}

export function presentSeniorityTrajectory(
  trajectory: SeniorityTrajectory | NoResult,
  scope: QualificationScope = {},
): PresentedSeniorityTrajectory {
  if (isNoResult(trajectory)) return trajectory
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
    endedByLabel: trajectory.endedBy?.label ?? null,
    hypotheticalLabel: hypotheticalPlacementLabel(trajectory.isHypothetical, scope),
  }
}

export function presentSeniorityTrajectoryComparison(
  comparison: SeniorityTrajectoryComparison | NoResult,
  baselineScope: QualificationScope = {},
  comparisonScope: QualificationScope = {},
): PresentedSeniorityTrajectoryComparison {
  if (isNoResult(comparison)) return comparison
  return {
    labels: comparison.points.map(point => point.date.toString()),
    baselineData: comparison.points.map(point => point.baselinePercentile),
    comparisonData: comparison.points.map(point => point.comparisonPercentile),
    endedByLabel: comparison.endedBy?.label ?? null,
    baselineHypotheticalLabel: hypotheticalPlacementLabel(comparison.baselineIsHypothetical, baselineScope),
    comparisonHypotheticalLabel: hypotheticalPlacementLabel(comparison.comparisonIsHypothetical, comparisonScope),
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

/** "Roster Size (modeled, hypothetical)": names why the count is not purely the published list. */
function rosterSizeQualifiers(standing: SeniorityStanding): string[] {
  return [standing.isModeled && 'modeled', standing.isHypothetical && 'hypothetical'].filter((item): item is string => !!item)
}

function rosterSizeTrend(standing: SeniorityStanding): string | null {
  const parts = [
    standing.isModeled && `${formatSeniorityCount(standing.publicationPilotCount)} in publication`,
    standing.isHypothetical && 'includes you',
  ].filter((item): item is string => !!item)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function presentSeniorityStanding(standing: SeniorityStanding | NoResult, scope: QualificationScope = {}) {
  if (isNoResult(standing)) return standing
  const qualifiers = rosterSizeQualifiers(standing)
  return {
    ...standing,
    rollingNext12MonthRetirementsLabel: formatSeniorityCount(standing.rollingNext12MonthRetirements),
    retirementsSeniorToAnchorLabel: `${formatSeniorityCount(standing.rollingNext12MonthRetirementsSeniorToAnchor)} senior to you`,
    rosterSizeLabel: qualifiers.length > 0 ? `Roster Size (${qualifiers.join(', ')})` : 'Roster Size',
    rosterSizeTrend: rosterSizeTrend(standing),
    hypotheticalLabel: hypotheticalPlacementLabel(standing.isHypothetical, scope),
    qualificationStandings: standing.qualificationStandings.map(item => ({
      ...item,
      qualificationLabel: formatQualification(item.qualification),
      rosterTrendLabel: `${formatQualification(item.qualification)} · of ${formatSeniorityCount(item.rosterSize)} on roster · ${formatSeniorityCount(item.activePilotCount)} active`,
      hypotheticalLabel: hypotheticalPlacementLabel(item.isHypothetical, item.qualification),
    })),
  }
}

export type PresentedSeniorityStanding = ReturnType<typeof presentSeniorityStanding>

export function presentPercentileCrossing(result: PercentileCrossingResult | null | NoResult): { year: string } | NoResult | null {
  if (isNoResult(result)) return result
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
  readonly rosterSize: number
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
  positions: readonly QualificationPosition[] | NoResult,
): PresentedQualificationPosition[] | NoResult {
  if (isNoResult(positions)) return positions
  return positions.map(position => ({
    ...position.distribution,
    currentPercentile: position.currentPercentile,
    projectedPercentile: position.projectedPercentile,
    modeledHoldable: position.modeledHoldable,
  }))
}
