import type {
  AnchoredRetirementCountProjection,
  HoldabilityDetail,
  HoldableYear,
  NoResult,
  PercentileCrossingResult,
  Qualification,
  QualificationPosition,
  QualificationScope,
  SeniorityDemographics,
  SeniorityStanding,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
  RetirementYearAnalysis,
  RetirementHeatmap,
} from '~/utils/seniority-engine/types'
import type { QualificationViewerAnalysis, QualificationViewerEntry } from '~/utils/seniority-engine/qual-viewer'
import { isNoResult } from '~/utils/seniority-engine/types'
import type { PlainDate } from '~/utils/temporal'
import type { RetirementCountProjection, TrajectoryChange } from './math'
import { diffDateYears, diffYears, formatMonthYear, formatYear } from '~/utils/date'

export type QualificationViewerRetirementTimeline = 'past' | 'imminent' | 'soon' | null

export interface PresentedQualificationViewerEntry extends QualificationViewerEntry {
  readonly retirementTimeline: QualificationViewerRetirementTimeline
  /** Company Rank for display; a placeholder for a retired pilot, who has none. */
  readonly companyRankLabel: string
  readonly publicationPositionLabel: string
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
    entries: analysis.entries.map((viewerEntry) => {
      const entry = {
        ...viewerEntry,
        companyRankLabel: viewerEntry.companyRank === null ? '--' : formatSeniorityCount(viewerEntry.companyRank),
        publicationPositionLabel: formatSeniorityCount(viewerEntry.publicationPosition),
      }
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
  /** Calendar year of the change, e.g. "2031". */
  readonly yearLabel: string
  /** Seniority Percentile after the change, one decimal, e.g. "62.4%". */
  readonly percentileLabel: string
  /** Signed percentile-point change, one decimal, e.g. "+3.2 pp". */
  readonly changeLabel: string
}

export interface PresentedSeniorityTrajectoryValue {
  chartData: { labels: string[]; data: number[] }
  changes: PresentedTrajectoryChange[]
  bestYearLabel: string | null
  retirementWave: { buckets: readonly RetirementYearAnalysis[]; percentileSeries: (number | null)[] }
  /** Why the samples stop early, worded as a stop, e.g. "Projection ends at your retirement". */
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

/** The plotted line keeps rendering up to the stop, so the reason reads as an end point, not as a no-result. */
const ENDED_BY_LABELS: Record<NoResult['reason'], string> = {
  'anchor-retired': 'Projection ends at your retirement',
  'trajectory-ended': 'Projection ends at your retirement',
}
const endedByLabelOf = (endedBy: NoResult | undefined): string | null => endedBy ? ENDED_BY_LABELS[endedBy.reason] : null

export interface PresentedAnchoredRetirementCountProjection extends PresentedRetirementCountProjection {
  readonly seniorRetirementCount: number
  readonly seniorRetirementLabel: string
}

export function presentAnchoredRetirementCountProjection(
  projection: AnchoredRetirementCountProjection,
  from: PlainDate,
  through: PlainDate,
): PresentedAnchoredRetirementCountProjection {
  const count = projection.seniorRetirementCount
  const years = Math.round(diffDateYears(from, through))
  return {
    ...presentRetirementCountProjection(projection),
    seniorRetirementCount: count,
    seniorRetirementLabel: `${count} ${count === 1 ? 'retirement' : 'retirements'} senior to you in the next ${years === 1 ? 'year' : `${years} years`}`,
  }
}

/** Names the scope the Anchor Pilot is placed into when outside it; null for a member. */
export function hypotheticalPlacementLabel(isHypothetical: boolean, scope: QualificationScope): string | null {
  return isHypothetical ? `Hypothetical Placement in ${formatQualificationScope(scope)}` : null
}

export function presentSeniorityTrajectory(
  trajectory: SeniorityTrajectory | NoResult,
  scope: QualificationScope = {},
  bestChange: TrajectoryChange | null = null,
  retirementYears: readonly RetirementYearAnalysis[] = [],
): PresentedSeniorityTrajectory {
  if (isNoResult(trajectory)) return trajectory
  const changes = trajectory.changes.map((change, index, all): PresentedTrajectoryChange => {
    const previous = index > 0 ? all[index - 1]!.percentilePointChange : -Infinity
    const next = index < all.length - 1 ? all[index + 1]!.percentilePointChange : -Infinity
    return {
      ...change,
      yearLabel: formatYear(change.date),
      percentileLabel: formatSeniorityPercentile(change.percentile),
      changeLabel: `${change.percentilePointChange > 0 ? '+' : ''}${change.percentilePointChange.toFixed(1)} pp`,
      isPeak:
        change.percentilePointChange > 0
        && change.percentilePointChange > previous
        && change.percentilePointChange > next,
    }
  })
  const percentileByYear = new Map<number, number>()
  for (const point of trajectory.points) {
    if (!percentileByYear.has(point.date.year)) percentileByYear.set(point.date.year, point.percentile)
  }
  return {
    bestYearLabel: bestChange ? `Best year: ${formatYear(bestChange.date)} (+${bestChange.percentilePointChange.toFixed(1)}pp)` : null,
    retirementWave: {
      buckets: retirementYears,
      percentileSeries: trajectory.points.length ? retirementYears.map(bucket => percentileByYear.get(bucket.year) ?? null) : [],
    },
    chartData: {
      labels: trajectory.points.map(point => point.date.toString()),
      data: trajectory.points.map(point => point.percentile),
    },
    changes,
    endedByLabel: endedByLabelOf(trajectory.endedBy),
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
    endedByLabel: endedByLabelOf(comparison.endedBy),
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

/** Seniority Percentile with one decimal so columns align; null (no Rank) renders a placeholder. */
export function formatSeniorityPercentile(value: number | null | undefined): string {
  return value == null ? '--' : `${value.toFixed(1)}%`
}

const SEAT_LABELS: Record<string, string> = { CA: 'Captain', FO: 'First Officer' }

export function formatSeatLabel(seat: string): string {
  return SEAT_LABELS[seat] ?? seat
}

/** Growth Assumptions as a phrase, e.g. "Retirements only" or "3.5% annual growth". */
export function formatGrowthAssumptions(assumptions: { enabled: boolean; annualGrowthRate: number }): string {
  return assumptions.enabled ? `${(assumptions.annualGrowthRate * 100).toFixed(1)}% annual growth` : 'Retirements only'
}

export function formatSeniorityRankChange(value: number): string {
  if (value === 0) return '--'
  return value > 0 ? `+${value}` : String(value)
}

/** The notes that explain why a count is not purely the published list, in "modeled, hypothetical" order. */
function rosterSizeNotes(standing: SeniorityStanding, modeled: string, hypothetical: string): string[] {
  return [standing.isModeled && modeled, standing.isHypothetical && hypothetical].filter((item): item is string => !!item)
}

function rosterSizeTrend(standing: SeniorityStanding): string | null {
  const parts = rosterSizeNotes(standing, `${formatSeniorityCount(standing.publicationPilotCount)} in publication`, 'includes you')
  return parts.length > 0 ? parts.join(' · ') : null
}

function holdabilitySummaryBySeat(standing: SeniorityStanding): Record<string, string | null> {
  const groups = new Map<string, { count: number; hypothetical: number }>()
  for (const row of standing.qualificationStandings) {
    const group = groups.get(row.qualification.seat) ?? { count: 0, hypothetical: 0 }
    group.count++
    if (row.isHypothetical) group.hypothetical++
    groups.set(row.qualification.seat, group)
  }
  return Object.fromEntries([...groups].map(([seat, group]) => [seat, group.hypothetical === 0
    ? null
    : `Hypothetical Placement in ${group.hypothetical === group.count ? 'all' : 'the other'} ${formatSeatLabel(seat)} Qualifications`]))
}

/** How today's Rank follows from the published list, e.g. "Publication Position 50 · 3 retired ahead". */
function rankNote(standing: SeniorityStanding): string {
  const position = `Publication Position ${formatSeniorityCount(standing.publicationPosition)}`
  return standing.retiredPilotsSeniorToAnchor === 0
    ? `${position} · none retired ahead`
    : `${position} · ${formatSeniorityCount(standing.retiredPilotsSeniorToAnchor)} retired ahead`
}

export function presentSeniorityStanding(standing: SeniorityStanding | NoResult, scope: QualificationScope = {}) {
  if (isNoResult(standing)) return standing
  const qualifiers = rosterSizeNotes(standing, 'modeled', 'hypothetical')
  const rosterSummary = `Roster Size ${formatSeniorityCount(standing.rosterSize)} · Active pilots ${formatSeniorityCount(standing.activePilotCount)}`
  return {
    ...standing,
    holdabilitySummaryBySeat: holdabilitySummaryBySeat(standing),
    retirementsSeniorToAnchorLabel: `${formatSeniorityCount(standing.rollingNext12MonthRetirementsSeniorToAnchor)} senior to you`,
    retirementsSeniorToAnchorCountLabel: formatSeniorityCount(standing.rollingNext12MonthRetirementsSeniorToAnchor),
    rosterSizeLabel: qualifiers.length > 0 ? `Roster Size (${qualifiers.join(', ')})` : 'Roster Size',
    rosterSizeTrend: rosterSizeTrend(standing),
    rosterSizeValueLabel: formatSeniorityCount(standing.rosterSize),
    rosterSummaryLabel: rosterSummary,
    percentileScaleLabel: `Percentile measured against ${rosterSummary}`,
    hypotheticalLabel: hypotheticalPlacementLabel(standing.isHypothetical, scope),
    rankLabel: formatSeniorityCount(standing.rank),
    rankNoteLabel: rankNote(standing),
    publicationPositionLabel: formatSeniorityCount(standing.publicationPosition),
    activePilotCountLabel: formatSeniorityCount(standing.activePilotCount),
    seniorityPercentileLabel: formatSeniorityPercentile(standing.seniorityPercentile),
    qualificationStandings: standing.qualificationStandings.map(item => ({
      ...item,
      qualificationLabel: formatQualification(item.qualification),
      rankLabel: formatSeniorityCount(item.rank),
      rosterOfLabel: `of ${formatSeniorityCount(item.rosterSize)}`,
      percentileLabel: formatSeniorityPercentile(item.seniorityPercentile),
      seatLabel: formatSeatLabel(item.qualification.seat),
      baseFleetLabel: `${item.qualification.base} ${item.qualification.fleet}`,
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
  const qualificationSizes = demographics.qualificationComposition
    .flatMap(qual => (qual.byBase.length ? qual.byBase : [{ base: '—', pilotCount: qual.pilotCount }])
      .map(({ base, pilotCount }) => ({ fleet: qual.fleet, seat: qual.seat, base, countLabel: pilotCount.toLocaleString() })))
    .sort((a, b) => a.seat.localeCompare(b.seat) || a.fleet.localeCompare(b.fleet) || a.base.localeCompare(b.base))
  return {
    matchingPilotCount: demographics.matchingPilotCount,
    anchorYearsOfService: demographics.anchorYearsOfService,
    hasYearsOfService: demographics.yearsOfServiceBuckets.some(bucket => bucket.pilotCount > 0),
    qualificationSizes,
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
  /** Company Roster Size, the scale of the percentiles; absent for sample data that carries none. */
  readonly rosterSize?: number
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
  /** "Fleet Seat Base", e.g. "737 CA JFK". */
  readonly qualificationLabel: string
  /** "now", the Holdable Year, or null when the trajectory ends first. */
  readonly holdableYear: 'now' | number | null
  readonly holdableLabel: string
  /** Set when the Anchor Pilot is junior to the Qualification's most junior active pilot today. */
  readonly thresholdRelationLabel: string | null
}

const NOT_BEFORE_RETIREMENT_LABEL = 'Not before your retirement'

function holdableYearLabel(holdableYear: HoldableYear): string {
  if (holdableYear === 'now') return 'Holdable now'
  if (isNoResult(holdableYear)) return NOT_BEFORE_RETIREMENT_LABEL
  return `Holdable from ${holdableYear}`
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
    qualificationLabel: `${position.distribution.qualification.fleet} ${position.distribution.qualification.seat} ${position.distribution.qualification.base}`,
    holdableYear: isNoResult(position.holdableYear) ? null : position.holdableYear,
    holdableLabel: holdableYearLabel(position.holdableYear),
    thresholdRelationLabel: position.holdableYear === 'now'
      ? null
      : `Junior to the most junior pilot (Seniority Number ${position.distribution.thresholdSeniorityNumber})`,
  }))
}

export interface PresentedHoldabilityDetail {
  readonly qualificationLabel: string
  readonly thresholdPercentile: number
  /** "83.3%". */
  readonly thresholdPercentileLabel: string
  /** ISO dates of the yearly samples. */
  readonly labels: readonly string[]
  readonly anchorSeries: readonly number[]
  /** Today's threshold pilot; null once they have retired. */
  readonly thresholdPilotSeries: readonly (number | null)[]
}

export function presentHoldabilityDetail(detail: HoldabilityDetail | null | NoResult): PresentedHoldabilityDetail | null | NoResult {
  if (!detail || isNoResult(detail)) return detail
  const { fleet, seat, base } = detail.qualification
  return {
    qualificationLabel: `${fleet} ${seat} ${base}`,
    thresholdPercentile: detail.thresholdPercentile,
    thresholdPercentileLabel: formatSeniorityPercentile(detail.thresholdPercentile),
    labels: detail.points.map(point => point.date.toString()),
    anchorSeries: detail.points.map(point => point.anchorPercentile),
    thresholdPilotSeries: detail.points.map(point => point.thresholdPilotPercentile),
  }
}

export interface PresentedRetirementHeatmapCell {
  readonly year: number
  readonly retirementCount: number
  /** Share of the group's active pilots retiring that year. */
  readonly percent: number
  readonly countLabel: string
  readonly percentLabel: string
  /** 0–1 against the busiest cell in each mode, for shading. */
  readonly countIntensity: number
  readonly percentIntensity: number
  /** Readable sentence for a tooltip or screen reader. */
  readonly description: string
}

export interface PresentedRetirementHeatmapRow {
  readonly key: string
  readonly label: string
  /** The row's name on the chart axis, with the figure it is sorted by when that is not Qualification. */
  readonly axisLabel: string
  readonly activePilotCountLabel: string
  /** Retirements across the shown years. */
  readonly totalLabel: string
  /** Share of the group's active pilots retiring across the shown years. */
  readonly totalPercentLabel: string
  readonly cells: readonly PresentedRetirementHeatmapCell[]
}

/** Qualification orders rows by Base, then Fleet, then Seat. The others put the largest figure across the shown years first. */
export type RetirementHeatmapSort = 'qualification' | 'retirements' | 'percent'

export interface RetirementHeatmapPresentationOptions {
  readonly sortBy?: RetirementHeatmapSort
  /** How many years to show from the As-of Date's year; all when omitted. */
  readonly years?: number
}

export interface PresentedRetirementHeatmap {
  readonly yearLabels: readonly string[]
  /** Every year with a scheduled retirement, for the years control's upper bound. */
  readonly availableYearCount: number
  /** "2026–2035", the shown years. */
  readonly yearRangeLabel: string
  /** In the requested order. */
  readonly rows: readonly PresentedRetirementHeatmapRow[]
  readonly isEmpty: boolean
  readonly undatedPilotNote: string | null
}

function pluralRetirements(count: number): string {
  return `${formatSeniorityCount(count)} ${count === 1 ? 'retirement' : 'retirements'}`
}

const numericCollator = new Intl.Collator(undefined, { numeric: true })

/** Base, then Fleet, then Seat; a dimension that is not grouped compares equal. */
function compareQualificationGroups(a: QualificationScope, b: QualificationScope): number {
  return numericCollator.compare(a.base ?? '', b.base ?? '')
    || numericCollator.compare(a.fleet ?? '', b.fleet ?? '')
    || numericCollator.compare(a.seat ?? '', b.seat ?? '')
}

function formatShare(percent: number): string {
  return `${percent.toFixed(1)}%`
}

/** Labels, percents, shading and row order for the Retirement Heatmap. An ungrouped row is named after the Qualification Scope. */
export function presentRetirementHeatmap(
  heatmap: RetirementHeatmap,
  scope: QualificationScope = {},
  options: RetirementHeatmapPresentationOptions = {},
): PresentedRetirementHeatmap {
  const sortBy = options.sortBy ?? 'qualification'
  const yearCount = Math.max(0, Math.min(heatmap.years.length, options.years ?? heatmap.years.length))
  const years = heatmap.years.slice(0, yearCount)
  const percentOf = (count: number, active: number) => active > 0 ? (count / active) * 100 : 0
  const shown = heatmap.rows.map(row => ({ row, counts: row.retirementCounts.slice(0, yearCount) }))
  const maxCount = shown.reduce((max, { counts }) => Math.max(max, ...counts), 0)
  const maxPercent = shown.reduce((max, { row, counts }) =>
    Math.max(max, ...counts.map(count => percentOf(count, row.activePilotCount))), 0)

  const rows = shown.map(({ row, counts }) => {
    const label = Object.keys(row.group).length ? formatQualificationScope(row.group) : formatQualificationScope(scope)
    const activePilots = `${formatSeniorityCount(row.activePilotCount)} active ${row.activePilotCount === 1 ? 'pilot' : 'pilots'}`
    const total = counts.reduce((sum, count) => sum + count, 0)
    const totalPercent = percentOf(total, row.activePilotCount)
    const totalLabel = pluralRetirements(total)
    const totalPercentLabel = formatShare(totalPercent)
    const axisLabel = sortBy === 'retirements' ? `${label} · ${formatSeniorityCount(total)}`
      : sortBy === 'percent' ? `${label} · ${totalPercentLabel}`
        : label
    return {
      group: row.group,
      total,
      totalPercent,
      key: label,
      label,
      axisLabel,
      activePilotCountLabel: activePilots,
      totalLabel,
      totalPercentLabel,
      cells: counts.map((retirementCount, index) => {
        const year = years[index]!
        const percent = percentOf(retirementCount, row.activePilotCount)
        const percentLabel = formatShare(percent)
        return {
          year,
          retirementCount,
          percent,
          countLabel: formatSeniorityCount(retirementCount),
          percentLabel,
          countIntensity: maxCount > 0 ? retirementCount / maxCount : 0,
          percentIntensity: maxPercent > 0 ? percent / maxPercent : 0,
          description: `${label} · ${year} · ${pluralRetirements(retirementCount)} (${percentLabel} of ${activePilots})`,
        }
      }),
    }
  })

  const byQualification = (a: typeof rows[number], b: typeof rows[number]) => compareQualificationGroups(a.group, b.group)
  const order = {
    qualification: byQualification,
    retirements: (a: typeof rows[number], b: typeof rows[number]) => b.total - a.total || byQualification(a, b),
    percent: (a: typeof rows[number], b: typeof rows[number]) => b.totalPercent - a.totalPercent || byQualification(a, b),
  }[sortBy]

  return {
    yearLabels: years.map(String),
    availableYearCount: heatmap.years.length,
    yearRangeLabel: years.length ? `${years[0]}\u2013${years.at(-1)}` : '',
    rows: rows.toSorted(order).map(({ group: _group, total: _total, totalPercent: _totalPercent, ...row }) => row),
    isEmpty: maxCount === 0,
    undatedPilotNote: heatmap.undatedPilotCount > 0
      ? `${formatSeniorityCount(heatmap.undatedPilotCount)} active ${heatmap.undatedPilotCount === 1 ? 'pilot has' : 'pilots have'} no retirement date and ${heatmap.undatedPilotCount === 1 ? 'is' : 'are'} not shown.`
      : null,
  }
}
