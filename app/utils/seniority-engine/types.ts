import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { PlainDate } from '~/utils/temporal'
import type { QualificationScope } from './qualification-scope'
import type { GrowthAssumptions } from '~/utils/seniority-analysis/growth'
import type {
  EntryPredicate,
  RetirementCountProjection,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
  SeniorityTrajectoryPoint,
  TrajectoryChange,
} from '~/utils/seniority-analysis/math'

export type {
  EntryPredicate,
  GrowthAssumptions,
  QualificationScope,
  RetirementCountProjection,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
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

export interface QualificationStanding {
  readonly qualification: Qualification
  readonly listRank: number
  readonly activeRank: number
  readonly listPilotCount: number
  readonly activePilotCount: number
  readonly listPercentile: number
  readonly activePercentile: number
  readonly isAnchorCurrentQualification: boolean
}

export interface SeniorityStanding {
  readonly listRank: number
  readonly activeRank: number
  readonly listPilotCount: number
  readonly activePilotCount: number
  readonly listPercentile: number
  readonly activePercentile: number
  readonly retiredPilotsSeniorToAnchor: number
  readonly rollingNext12MonthRetirements: number
  readonly rollingNext12MonthRetirementsSeniorToAnchor: number
  readonly qualificationStandings: readonly QualificationStanding[]
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
  /** Positive is senior to the anchor; zero is the anchor; negative is junior. */
  readonly positionsSeniorToAnchor: number
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
  seniorityStanding(): SeniorityStanding
  seniorityTrajectory(options: SeniorityTrajectoryOptions): SeniorityTrajectory
  seniorityTrajectoryComparison(options: SeniorityTrajectoryComparisonOptions): SeniorityTrajectoryComparison
  percentileCrossing(options: PercentileCrossingOptions): PercentileCrossingResult | null
  qualificationPositions(options: QualificationPositionOptions): readonly QualificationPosition[]
  relativeUpcomingRetirements(filter: RelativeUpcomingRetirementFilter): readonly RelativeUpcomingRetirement[]
}
