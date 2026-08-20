/**
 * Pure seniority analysis API.
 *
 * Reach-for map:
 *
 * ```text
 * validated SeniorityEntry[]
 *          |
 *          | createSnapshot(entries)
 *          v
 * [SenioritySnapshot]
 *          |
 *          | createLens(snapshot, { asOfDate })
 *          v
 * [SeniorityLens] --------------------------> organization analysis
 *          |                                  - demographics
 *          | withAnchor(employeeNumber)       - retirement waves/projections
 *          |                                  - organization retirements
 *          v
 * [AnchoredSeniorityLens] ------------------> pilot-relative analysis
 *                                             - standing and trajectory
 *                                             - comparisons and thresholds
 *                                             - qualification scales with holdability state
 *                                             - relative retirements
 *
 * Optional calculation inputs
 *   createScenario(...) --> scope and growth assumptions for lens methods
 *   QualSpec            --> fleet, seat, and base scope
 *
 * Standalone qualification table
 *   projectQualViewer(...) --> rows, ranks, and optional user marker
 * ```
 *
 * Start with a lens for seniority analysis. Use an anchored lens only after an
 * employee is present in the snapshot. Lens methods own the snapshot,
 * reference-date, scope, and memoization rules for their results.
 */

// Core engine
export { createSnapshot, uniqueEntryValues } from './snapshot'
export { createScenario } from './scenario'
export { AnchorNotFoundError, createLens } from './lens'
export { projectQualViewer } from './qual-viewer'
export type { QualViewerRow, QualViewerResult, QualViewerOptions, QualViewerStatus } from './qual-viewer'
export {
  COMPANY_WIDE,
  qualSpecToFilter,
  qualSpecLabel,
  qualSpecEquals,
  enumerateQualSpecs,
} from './qual-spec'

// Math primitives (re-exported from seniority-math until fully absorbed)
export {
  computeRank,
  countRetiredAbove,
  buildTrajectory,
  generateTimePoints,
  getProjectionEndDate,
  getProjectionEndDateValue,
  projectRetirements,
  projectComparativeTrajectory,
  computeTrajectoryDeltas,
  formatRankDelta,
  formatNumber,
} from '~/utils/seniority-math'

// Growth config (re-exported from growth-config until fully absorbed)
export {
  DEFAULT_GROWTH_CONFIG,
  computeAdditionalPilots,
} from '~/utils/growth-config'

// Types
export type {
  SenioritySnapshot,
  Scenario,
  ScenarioOptions,
  Qual,
  QualSpec,
  CommonSeniorityLens,
  SeniorityLens,
  AnchoredSeniorityLens,
  StandingResult,
  CellBreakdownRow,
  TrajectoryPoint,
  TrajectoryResult,
  ComparativeTrajectoryResult,
  RetirementProjectionResult,
  RetirementProjectionOptions,
  DemographicsResult,
  UpcomingRetirementFilter,
  UpcomingRetirementRow,
  UpcomingRetirementRelativeFilter,
  UpcomingRetirementRelativeRow,
  TrajectoryDelta,
  AgeBucket,
  DensityBucket,
  GrowthConfig,
  MostJuniorCARow,
  QualCompositionRow,
  QualDemographicScale,
  RetirementWaveBucket,
  ThresholdResult,
  YosDistribution,
  YosHistogramBucket,
} from './types'
