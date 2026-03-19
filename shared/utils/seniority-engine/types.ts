// shared/utils/seniority-engine/types.ts
import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import type { GrowthConfig } from '#shared/types/growth-config'
import type {
  TrajectoryDelta,
} from '#shared/utils/seniority-math'
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
} from '#shared/utils/qual-analytics'
import type { QualSpec } from './qual-spec'

// Re-export types consumers will need alongside engine types
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

// ─── Core Primitives ────────────────────────────────────────────────────

export interface PilotAnchor {
  readonly seniorityNumber: number
  readonly retireDate: string | null
  readonly employeeNumber: string
}

export interface ScenarioOptions {
  projectionDate?: Date
  growthConfig?: GrowthConfig
  scopeFilter?: QualSpec
}

export interface Scenario {
  readonly projectionDate: Date
  readonly growthConfig: GrowthConfig
  readonly scopeFilter: QualSpec
}

// Full qual — all three dimensions required (enforced by snapshot validation).
// For filter scoping, use QualSpec (partial qual) instead.
export interface Qual {
  readonly seat: string
  readonly fleet: string
  readonly base: string
  readonly label: string
}

export interface SenioritySnapshot {
  /** All entries, original order */
  readonly entries: readonly SeniorityEntry[]
  /** Sorted entries in ascending seniority number order */
  readonly sortedEntries: SeniorityEntry[]
  /** Entries grouped by "base|seat|fleet" cell key */
  readonly byCell: Map<string, SeniorityEntry[]>
  /** Employee number -> entry lookup */
  readonly byEmployeeNumber: Map<string, SeniorityEntry>
  /** Unique base values, sorted */
  readonly uniqueBases: string[]
  /** Unique seat values, sorted */
  readonly uniqueSeats: string[]
  /** Unique fleet values, sorted */
  readonly uniqueFleets: string[]
  /** All distinct seat/fleet/base qual labels, sorted. Format: "CA/737/JFK". */
  readonly quals: Qual[]
}

// ─── Result Types ───────────────────────────────────────────────────────

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

// TrajectoryPoint is re-exported from qual-analytics (see above)

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

// ─── The Lens Interface ─────────────────────────────────────────────────

export interface SeniorityLens {
  /** Where am I right now? Company-wide rank + per-cell breakdown. */
  standing(): StandingResult | null

  /** Yearly rank/percentile trajectory to retirement. */
  trajectory(scenario?: Scenario): TrajectoryResult | null

  /** Two trajectories under different scenarios (different scope filters). */
  compareTrajectories(
    scenarioA: Scenario,
    scenarioB: Scenario,
  ): ComparativeTrajectoryResult | null

  /** When does the user cross a target percentile? Base/optimistic/pessimistic. */
  percentileCrossing(
    targetPercentile: number,
    scenario?: Scenario,
  ): ThresholdResult | null

  /** What quals can the user hold at a projected date? */
  holdability(scenario?: Scenario): PowerIndexCell[]

  /** Qual demographic scales with user percentile overlay. */
  qualScales(scenario?: Scenario): QualDemographicScale[]

  /** Retirement wave buckets with wave detection, optionally scoped. */
  retirementWave(scenario?: Scenario): RetirementWaveBucket[]

  /** Retirement projection buckets (yearly counts), optionally scoped. */
  retirementProjection(scenario?: Scenario): RetirementProjectionResult

  /** List-level demographics: age, YOS, qual composition. */
  demographics(mandatoryAge: number, scenario?: Scenario): DemographicsResult

  /** The underlying snapshot (read-only). */
  readonly snapshot: SenioritySnapshot

  /** The anchor pilot, or null if none provided. */
  readonly anchor: PilotAnchor | null
}
