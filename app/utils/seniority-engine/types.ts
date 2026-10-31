import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { PlainDate } from '~/utils/temporal'
import type { QualificationScope } from './qualification-scope'
import type { GrowthAssumptions } from '~/utils/seniority-analysis/growth'
import type {
  EntryPredicate,
  RetirementCountProjection,
  SeniorityTrajectory as CalculatedSeniorityTrajectory,
  SeniorityTrajectoryComparison as CalculatedSeniorityTrajectoryComparison,
  SeniorityTrajectoryPoint,
  TrajectoryChange,
} from '~/utils/seniority-analysis/math'

export type {
  EntryPredicate,
  GrowthAssumptions,
  QualificationScope,
  RetirementCountProjection,
  SeniorityTrajectoryPoint,
  TrajectoryChange,
}

export interface Qualification {
  readonly base: string
  readonly seat: string
  readonly fleet: string
}

export interface ScenarioOptions {
  readonly growthAssumptions?: GrowthAssumptions
  readonly qualificationScope?: QualificationScope
}

/** Analysis assumptions without an implicit date or projection horizon. */
export interface Scenario {
  readonly growthAssumptions: GrowthAssumptions
  readonly qualificationScope: QualificationScope
}

/** Compile-time readonly views over validated Seniority Entries and their indexes. */
export interface SenioritySnapshot {
  readonly entries: readonly Readonly<SeniorityEntry>[]
  readonly entriesBySeniority: readonly Readonly<SeniorityEntry>[]
  readonly entriesByQualification: ReadonlyMap<string, readonly Readonly<SeniorityEntry>[]>
  readonly entriesByEmployeeNumber: ReadonlyMap<string, Readonly<SeniorityEntry>>
  readonly bases: readonly string[]
  readonly seats: readonly string[]
  readonly fleets: readonly string[]
  readonly qualifications: readonly Qualification[]
}

export type NoResultReason = 'anchor-retired'

/** Explicit absence of a result: a retired Anchor Pilot has no Rank or projection. */
export interface NoResult {
  readonly kind: 'no-result'
  readonly reason: NoResultReason
  readonly label: string
}

/** A trajectory whose samples stopped because the Anchor Pilot retired inside the projection window. */
export interface SeniorityTrajectory extends CalculatedSeniorityTrajectory {
  readonly endedBy?: NoResult
  /** True when the Anchor Pilot is outside the Qualification Scope and is placed there by Seniority Number. */
  readonly isHypothetical: boolean
}

export interface SeniorityTrajectoryComparison extends CalculatedSeniorityTrajectoryComparison {
  readonly endedBy?: NoResult
  readonly baselineIsHypothetical: boolean
  readonly comparisonIsHypothetical: boolean
}

export interface QualificationStanding {
  readonly qualification: Qualification
  readonly rank: number
  readonly publicationPosition: number
  readonly rosterSize: number
  readonly activePilotCount: number
  readonly seniorityPercentile: number
  readonly isAnchorCurrentQualification: boolean
  /** True when the Anchor Pilot is not in this Qualification and is counted in its Roster Size as a modeled pilot. */
  readonly isHypothetical: boolean
}

export interface SeniorityStanding {
  readonly rank: number
  readonly publicationPosition: number
  readonly rosterSize: number
  /** Real pilots in the Qualification Scope in the publication. Excludes a modeled New Hire pilot and a Hypothetical Placement. */
  readonly publicationPilotCount: number
  readonly activePilotCount: number
  readonly seniorityPercentile: number
  readonly retiredPilotsSeniorToAnchor: number
  readonly rollingNext12MonthRetirements: number
  readonly rollingNext12MonthRetirementsSeniorToAnchor: number
  readonly qualificationStandings: readonly QualificationStanding[]
  /** True when the Anchor Pilot is outside the Qualification Scope and is placed there by Seniority Number. */
  readonly isHypothetical: boolean
  /** True when the Anchor Pilot is the modeled New Hire pilot rather than a pilot in the publication. */
  readonly isModeled: boolean
}

export interface AgeBucket {
  readonly minimumAge: number
  readonly maximumAge?: number
  readonly pilotCount: number
}

export interface CaptainQualificationThreshold {
  readonly qualification: Qualification
  readonly seniorityNumber: number
  readonly hireDate: PlainDate
  readonly yearsOfService: number
}

export interface YearsOfServiceDistribution {
  readonly entryFloor: number
  readonly p10: number
  readonly p25: number
  readonly median: number
  readonly p75: number
  readonly p90: number
  readonly maximum: number
}

export interface YearsOfServiceBucket {
  readonly minimumYears: number
  readonly maximumYears?: number
  readonly pilotCount: number
}

export interface QualificationComposition {
  readonly fleet: string
  readonly seat: string
  readonly pilotCount: number
  readonly captainCount: number
  readonly firstOfficerCount: number
  readonly captainToFirstOfficerRatio: number
  readonly byBase: readonly { readonly base: string; readonly pilotCount: number; readonly percentage: number }[]
}

export interface RetirementYearAnalysis {
  readonly year: number
  readonly retirementCount: number
  readonly isRetirementWave: boolean
}

export interface PercentileDensityBucket {
  readonly minimumPercentile: number
  readonly maximumPercentile: number
  readonly pilotCount: number
}

export interface QualificationDistribution {
  readonly qualification: Qualification
  readonly activePilotCount: number
  /** Pilots in the analyzed set in the publication, retired included. */
  readonly rosterSize: number
  readonly thresholdPercentile: number
  readonly thresholdSeniorityNumber: number
  readonly percentile25: number
  readonly medianPercentile: number
  readonly percentile75: number
  readonly maximumPercentile: number
  readonly percentileDensity: readonly PercentileDensityBucket[]
}

export interface QualificationPosition {
  readonly distribution: QualificationDistribution
  readonly currentPercentile: number
  readonly projectedPercentile: number
  readonly modeledHoldable: boolean
}

export interface PercentileCrossingResult {
  readonly crossingYear: number
}

export interface SeniorityDemographics {
  readonly ageDistribution: {
    readonly buckets: readonly AgeBucket[]
    readonly unknownAgePilotCount: number
  }
  readonly yearsOfServiceDistribution: YearsOfServiceDistribution
  readonly yearsOfServiceBuckets: readonly YearsOfServiceBucket[]
  readonly qualificationComposition: readonly QualificationComposition[]
  readonly captainQualificationThresholds: readonly CaptainQualificationThreshold[]
}

export interface RetirementCountProjectionOptions {
  readonly through: PlainDate
  readonly scenario?: Scenario
}

export interface DemographicsOptions {
  readonly mandatoryRetirementAge: number
  readonly scenario?: Scenario
}

export interface UpcomingRetirementFilter {
  readonly through: PlainDate
  readonly qualificationScope?: QualificationScope
}

export interface UpcomingRetirement {
  readonly seniorityNumber: number
  readonly employeeNumber: string
  readonly qualification: Qualification
  readonly retirementDate: PlainDate
}

export interface RelativeUpcomingRetirementFilter extends UpcomingRetirementFilter {
  readonly seniorOnly?: boolean
}

export interface RelativeUpcomingRetirement extends UpcomingRetirement {
  /** Difference in dynamic Rank (retired pilots are not counted). Positive is senior to the anchor; zero is the anchor; negative is junior. */
  readonly positionsSeniorToAnchor: number
}

export function isNoResult(value: unknown): value is NoResult {
  return typeof value === 'object' && value !== null && (value as { kind?: unknown }).kind === 'no-result'
}

/** The result itself, or null when it is absent or a no-result. */
export function resultOrNull<T>(value: T | NoResult | null | undefined): T | null {
  return value && !isNoResult(value) ? value : null
}

export interface SeniorityStandingOptions {
  readonly scenario?: Scenario
}

export interface SeniorityTrajectoryOptions {
  readonly through: PlainDate
  readonly scenario?: Scenario
}

export interface SeniorityTrajectoryComparisonOptions {
  readonly through: PlainDate
  readonly baselineScenario: Scenario
  readonly comparisonScenario: Scenario
}

export interface PercentileCrossingOptions extends SeniorityTrajectoryOptions {
  readonly targetPercentile: number
}

/** Qualification Position is company-wide so the percentile and the Qualification Thresholds share one scale. */
export interface QualificationPositionOptions {
  readonly through: PlainDate
  readonly growthAssumptions?: GrowthAssumptions
}

export interface CommonSeniorityLens {
  readonly snapshot: SenioritySnapshot
  retirementsNext12Months(): number
  retirementYearAnalysis(scenario?: Scenario): readonly RetirementYearAnalysis[]
  retirementCountProjection(options: RetirementCountProjectionOptions): RetirementCountProjection
  demographics(options: DemographicsOptions): SeniorityDemographics
  upcomingRetirements(filter: UpcomingRetirementFilter): readonly UpcomingRetirement[]
}

export interface SeniorityLens extends CommonSeniorityLens {
  withAnchor(employeeNumber: string): AnchoredSeniorityLens
}

export interface AnchoredSeniorityLens extends CommonSeniorityLens {
  readonly anchor: Readonly<SeniorityEntry>
  seniorityStanding(options?: SeniorityStandingOptions): SeniorityStanding | NoResult
  seniorityTrajectory(options: SeniorityTrajectoryOptions): SeniorityTrajectory | NoResult
  seniorityTrajectoryComparison(options: SeniorityTrajectoryComparisonOptions): SeniorityTrajectoryComparison | NoResult
  percentileCrossing(options: PercentileCrossingOptions): PercentileCrossingResult | null | NoResult
  qualificationPositions(options: QualificationPositionOptions): readonly QualificationPosition[] | NoResult
  relativeUpcomingRetirements(filter: RelativeUpcomingRetirementFilter): readonly RelativeUpcomingRetirement[]
}
