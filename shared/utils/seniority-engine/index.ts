export { createSnapshot } from './snapshot'
export { createScenario } from './scenario'
export { createLens } from './lens'
export type {
  // Core primitives
  SenioritySnapshot,
  Scenario,
  ScenarioOptions,
  PilotAnchor,
  Qual,
  SeniorityLens,
  // Result types
  StandingResult,
  CellBreakdownRow,
  TrajectoryPoint,
  TrajectoryResult,
  ComparativeTrajectoryResult,
  RetirementProjectionResult,
  DemographicsResult,
  // Re-exported from existing modules
  FilterFn,
  TrajectoryDelta,
  AgeBucket,
  MostJuniorCARow,
  PowerIndexCell,
  QualCompositionRow,
  QualDemographicScale,
  RetirementWaveBucket,
  ThresholdResult,
  YosDistribution,
  YosHistogramBucket,
} from './types'
