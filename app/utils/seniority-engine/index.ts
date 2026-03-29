// Core engine
export { createSnapshot, uniqueEntryValues } from './snapshot'
export { createScenario } from './scenario'
export { createLens } from './lens'
export { computePercentile } from './percentile'
export { cellKey } from './cell-key'
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
  projectRetirements,
  projectComparativeTrajectory,
  computeTrajectoryDeltas,
  formatRankDelta,
  formatNumber,
} from '~/utils/seniority-math'

// Analytics (re-exported from qual-analytics until fully absorbed)
export {
  SEAT_ORDER,
  qualKey,
  computeAgeDistribution,
  computeYosDistribution,
  computeYosHistogram,
  computeQualComposition,
  findMostJuniorCA,
  computeRetirementWave,
  computePowerIndexCells,
  computeQualSnapshots,
  applyProjectionToSnapshots,
  findThresholdYear,
  detectUpgradeTransitions,
} from '~/utils/qual-analytics'

// Growth config (re-exported from growth-config until fully absorbed)
export {
  DEFAULT_GROWTH_CONFIG,
  computeAdditionalPilots,
} from '~/utils/growth-config'

// Types
export type {
  FilterFn,
  SenioritySnapshot,
  Scenario,
  ScenarioOptions,
  PilotAnchor,
  Qual,
  QualSpec,
  SeniorityLens,
  StandingResult,
  CellBreakdownRow,
  TrajectoryPoint,
  TrajectoryResult,
  ComparativeTrajectoryResult,
  RetirementProjectionResult,
  DemographicsResult,
  UpcomingRetirementFilter,
  UpcomingRetirementRow,
  TrajectoryDelta,
  AgeBucket,
  DensityBucket,
  GrowthConfig,
  MostJuniorCARow,
  PowerIndexCell,
  PowerIndexCellState,
  QualCompositionRow,
  QualDemographicScale,
  QualDemographicSnapshot,
  RetirementWaveBucket,
  ThresholdResult,
  UpgradeTransition,
  YosDistribution,
  YosHistogramBucket,
} from './types'
