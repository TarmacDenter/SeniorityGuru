import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { GrowthConfig } from '~/utils/growth-config'
import type {
  TrajectoryDelta,
} from '~/utils/seniority-math'
import type {
  AgeBucket,
  MostJuniorCARow,
  PowerIndexCell,
  QualCompositionRow,
  QualDemographicScale,
  RetirementWaveBucket,
  ThresholdResult,
  TrajectoryPoint,
  YosDistribution,
  YosHistogramBucket,
} from '~/utils/qual-analytics'
import type { QualSpec } from './qual-spec'

export type {
  QualSpec,
  TrajectoryDelta,
  TrajectoryPoint,
  AgeBucket,
  MostJuniorCARow,
  PowerIndexCell,
  QualCompositionRow,
  QualDemographicScale,
  RetirementWaveBucket,
  ThresholdResult,
  YosDistribution,
  YosHistogramBucket,
}

export interface PilotAnchor {
  readonly seniorityNumber: number
  readonly retireDate: string | null
  readonly employeeNumber: string
}

export interface ScenarioOptions {
  projectionDate?: string
  growthConfig?: GrowthConfig
  scopeFilter?: QualSpec
}

export interface Scenario {
  readonly projectionDate: string
  readonly growthConfig: GrowthConfig
  readonly scopeFilter: QualSpec
}

export interface Qual {
  readonly seat: string
  readonly fleet: string
  readonly base: string
  readonly label: string
}

export interface SenioritySnapshot {
  readonly entries: readonly SeniorityEntry[]
  readonly sortedEntries: SeniorityEntry[]
  readonly byCell: Map<string, SeniorityEntry[]>
  readonly byEmployeeNumber: Map<string, SeniorityEntry>
  readonly uniqueBases: string[]
  readonly uniqueSeats: string[]
  readonly uniqueFleets: string[]
  readonly quals: Qual[]
}

export interface StandingResult {
  rank: number
  adjustedRank: number
  total: number
  retiredAbove: number
  retirementsThisYear: number
  retirementsThisYearSeniorToAnchor: number
  cellBreakdown: CellBreakdownRow[]
}

export interface CellBreakdownRow {
  base: string
  seat: string
  fleet: string
  rank: number
  adjustedRank: number
  total: number
  adjustedTotal: number
  percentile: number
  adjustedPercentile: number
  isAnchorCurrent: boolean
}

export interface TrajectoryResult {
  points: TrajectoryPoint[]
  chartData: { labels: string[]; data: number[] }
  deltas: TrajectoryDelta[]
}

export interface ComparativeTrajectoryResult {
  labels: string[]
  currentData: number[]
  compareData: number[]
}

export interface RetirementProjectionResult {
  labels: string[]
  data: number[]
  filteredTotal: number
}

export interface DemographicsResult {
  ageDistribution: { buckets: AgeBucket[]; nullCount: number }
  yosDistribution: YosDistribution
  yosHistogram: YosHistogramBucket[]
  qualComposition: QualCompositionRow[]
  mostJuniorCAs: MostJuniorCARow[]
}

export interface UpcomingRetirementFilter {
  yearsHorizon: number
  seniorOnly: boolean
  base?: string | null
  seat?: string | null
  fleet?: string | null
}

export interface UpcomingRetirementRow {
  seniorityNumber: number
  employeeNumber: string
  base: string
  seat: string
  fleet: string
  retireDate: string
  /** Positive = user is N positions junior to this pilot; null when no anchor. */
  rankRelativeToMe: number | null
}

export interface SeniorityLens {
  standing(): StandingResult | null
  trajectory(scenario?: Scenario): TrajectoryResult | null
  compareTrajectories(scenarioA: Scenario, scenarioB: Scenario): ComparativeTrajectoryResult | null
  percentileCrossing(targetPercentile: number, scenario?: Scenario): ThresholdResult | null
  holdability(scenario?: Scenario): PowerIndexCell[]
  qualScales(scenario?: Scenario): QualDemographicScale[]
  retirementWave(scenario?: Scenario): RetirementWaveBucket[]
  retirementProjection(scenario?: Scenario): RetirementProjectionResult
  demographics(mandatoryAge: number, scenario?: Scenario): DemographicsResult
  upcomingRetirements(filter: UpcomingRetirementFilter): UpcomingRetirementRow[]
  readonly snapshot: SenioritySnapshot
  readonly anchor: PilotAnchor | null
}
