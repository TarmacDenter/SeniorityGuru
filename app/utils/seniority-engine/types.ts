import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { QualSpec } from './qual-spec'
import type { PlainDate } from '~/utils/temporal'

export type { QualSpec }

/** Predicate used to restrict an analysis to a subset of validated entries. */
export type FilterFn = (entry: SeniorityEntry) => boolean

export interface TrajectoryPoint {
  date: PlainDate
  rank: number
  percentile: number
}

export interface TrajectoryDelta {
  date: PlainDate
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
  hireDate: PlainDate
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

/** Assumptions for projected hiring growth. */
export interface GrowthConfig {
  enabled: boolean
  annualRate: number
  qualOverrides?: { spec: QualSpec; rate: number }[]
}

/** Optional scope and growth assumptions for one calculation. */
export interface ScenarioOptions {
  projectionDate: PlainDate
  growthConfig?: GrowthConfig
  scopeFilter?: QualSpec
}

/** Normalized scenario with explicit defaults. Create it with `createScenario`. */
export interface Scenario {
  readonly projectionDate: PlainDate
  readonly growthConfig: GrowthConfig
  readonly scopeFilter: QualSpec
}

/** One populated base, seat, and fleet combination in a snapshot. */
export interface Qual {
  readonly seat: string
  readonly fleet: string
  readonly base: string
  readonly label: string
}

/**
 * Immutable entry collection plus indexes for pure seniority analysis.
 *
 * Create snapshots with `createSnapshot`. Callers must not mutate its entries
 * or lookup collections after construction.
 */
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

/** Pilot-relative organization and qualification standing at the lens date. */
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

/** Projected seniority points with chart-ready data and annual deltas. */
export interface TrajectoryResult {
  points: TrajectoryPoint[]
  chartData: { labels: string[]; data: number[] }
  deltas: TrajectoryDelta[]
}

/** Parallel projected percentile series for two qualification scopes. */
export interface ComparativeTrajectoryResult {
  labels: string[]
  currentData: number[]
  compareData: number[]
}

/** Retirement counts grouped into projection time buckets. */
export interface RetirementProjectionResult {
  labels: string[]
  data: number[]
  filteredTotal: number
}

/** Organization demographics and qualification composition at the lens date. */
export interface DemographicsResult {
  ageDistribution: { buckets: AgeBucket[]; nullCount: number }
  yosDistribution: YosDistribution
  yosHistogram: YosHistogramBucket[]
  qualComposition: QualCompositionRow[]
  mostJuniorCAs: MostJuniorCARow[]
}

/** Configures a retirement projection from an organization or anchored lens. */
export interface RetirementProjectionOptions {
  /** Optional growth and qualification assumptions. */
  scenario?: Scenario
  /** Projection end date. The default is the lens date plus 30 years. */
  through?: PlainDate | null
}

/** Filters organization retirement rows by horizon and qualification. */
export interface UpcomingRetirementFilter {
  yearsHorizon: number
  base?: string | null
  seat?: string | null
  fleet?: string | null
}

/** A future retirement row with organization-level data only. */
export interface UpcomingRetirementRow {
  seniorityNumber: number
  employeeNumber: string
  base: string
  seat: string
  fleet: string
  retireDate: PlainDate
}

/** Adds an anchor-relative restriction to an organization retirement filter. */
export interface UpcomingRetirementRelativeFilter extends UpcomingRetirementFilter {
  seniorOnly: boolean
}

/** A future retirement row expressed relative to an anchored pilot. */
export interface UpcomingRetirementRelativeRow extends UpcomingRetirementRow {
  /** Positive means the anchor is this many positions junior to the pilot. */
  rankRelativeToAnchor: number
}

/**
 * Organization-level analysis over one immutable snapshot.
 *
 * These methods never depend on a pilot anchor, so their results remain stable
 * for every derived anchored lens that shares this snapshot and reference date.
 */
export interface CommonSeniorityLens {
  /** Counts retirements in the 12 months after the lens date. */
  retirementsThisYear(): number
  /** Groups retirement counts by year for an optional qualification scope. */
  retirementWave(scenario?: Scenario): RetirementWaveBucket[]
  /** Projects retirement counts through an optional end date. */
  retirementProjection(options?: RetirementProjectionOptions): RetirementProjectionResult
  /** Computes organization demographics for a mandatory retirement age. */
  demographics(mandatoryAge: number, scenario?: Scenario): DemographicsResult
  /** Lists future organization retirements without pilot-relative fields. */
  upcomingRetirements(filter: UpcomingRetirementFilter): UpcomingRetirementRow[]
  /** The immutable snapshot shared by this lens and its derived lenses. */
  readonly snapshot: SenioritySnapshot
}

/**
 * An unanchored organization lens. It owns shared organization memoization and
 * can derive immutable pilot-relative lenses without rebuilding its snapshot.
 */
export interface SeniorityLens extends CommonSeniorityLens {
  /**
   * Derives pilot-relative analysis for a canonical entry in this snapshot.
   *
   * @throws {AnchorNotFoundError} When the employee number is absent.
   */
  withAnchor(employeeNumber: string): AnchoredSeniorityLens
}

/**
 * A pilot-relative view derived from an immutable organization lens.
 *
 * `anchor` is the canonical readonly entry held by `snapshot`, never a copied
 * or caller-provided anchor shape. Each derived lens keeps its own relative
 * memoization while sharing organization memoization and the same snapshot.
 */
export interface AnchoredSeniorityLens extends CommonSeniorityLens {
  /** Canonical readonly entry from the shared snapshot. */
  readonly anchor: Readonly<SeniorityEntry>
  /** Computes organization and qualification standing for the anchor. */
  standing(): StandingResult
  /** Projects the anchor's seniority through its retirement date. */
  trajectory(scenario?: Scenario): TrajectoryResult
  /** Compares the anchor's projected percentile in two qualification scopes. */
  compareTrajectories(scenarioA: Scenario, scenarioB: Scenario): ComparativeTrajectoryResult
  /** Finds the first year the anchor reaches a target percentile, if any. */
  percentileCrossing(targetPercentile: number, scenario?: Scenario): ThresholdResult | null
  /** Computes projected qualification demographic scales for the anchor. */
  qualScales(scenario?: Scenario): QualDemographicScale[]
  /** Lists future retirements with anchor-relative rank and senior-only filtering. */
  upcomingRetirementsRelativeToAnchor(filter: UpcomingRetirementRelativeFilter): UpcomingRetirementRelativeRow[]
}
