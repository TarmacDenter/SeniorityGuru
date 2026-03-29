import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { QualSpec } from './qual-spec'

export type { QualSpec }

export type FilterFn = (entry: SeniorityEntry) => boolean

export interface TrajectoryPoint {
  date: string
  rank: number
  percentile: number
}

export interface TrajectoryDelta {
  date: string
  percentile: number
  delta: number
  isPeak: boolean
}

export interface AgeBucket {
  label: string
  count: number
}

export interface MostJuniorCARow {
  qualKey: string
  fleet: string
  seat: string
  base: string
  seniorityNumber: number
  hireDate: string
  yos: number
}

export interface YosDistribution {
  entryFloor: number
  p10: number
  p25: number
  median: number
  p75: number
  p90: number
  max: number
}

export interface YosHistogramBucket {
  label: string
  minYos: number
  count: number
}

export interface QualCompositionRow {
  qualKey: string
  fleet: string
  seat: string
  total: number
  caCount: number
  foCount: number
  caFoRatio: number
  byBase: { base: string; count: number; pct: number }[]
}

export interface RetirementWaveBucket {
  year: number
  count: number
  isWave: boolean
}

export type PowerIndexCellState = 'green' | 'amber' | 'red'

export interface PowerIndexCell {
  fleet: string
  seat: string
  base: string
  state: PowerIndexCellState
  retiredCount: number
  totalInCell: number
  pilotsAhead: number
  isLowestSeniority: boolean
  cellPercentile: number
  numbersJuniorToPlug: number
  plugPercentile: number
  userPercentile: number
}

export interface DensityBucket {
  start: number
  count: number
}

export interface QualDemographicSnapshot {
  fleet: string
  seat: string
  base: string
  activeCount: number
  plugPercentile: number
  plugSenNum: number
  p25: number
  median: number
  p75: number
  max: number
  density: DensityBucket[]
}

export interface QualDemographicScale extends QualDemographicSnapshot {
  userPercentile: number
  currentUserPercentile: number
  isHoldable: boolean
}

export interface ThresholdResult {
  year: string
}

export interface UpgradeTransition {
  employeeNumber: string
  name: string | undefined
  seniorityNumber: number
  type: 'upgrade' | 'fleet-change' | 'downgrade' | 'other'
  oldSeat: string
  newSeat: string
  oldFleet: string
  newFleet: string
}

export interface GrowthConfig {
  enabled: boolean
  annualRate: number
  qualOverrides?: { spec: QualSpec; rate: number }[]
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
  adjustedTotal: number
  percentile: number
  adjustedPercentile: number
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
