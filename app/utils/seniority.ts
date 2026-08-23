/** Supported Seniority Analysis interface: math → engine → presentation. */
export {
  calculateRetirementCountProjection,
  calculateSeniorityPercentile,
  calculateSeniorityRank,
  calculateSeniorityTrajectory,
  calculateSeniorityTrajectoryComparison,
  calculateTrajectoryChanges,
  countRetiredPilotsSeniorTo,
  generateAnnualSeniorityDates,
} from './seniority-analysis/math'
export type {
  CalculateRetirementCountProjectionOptions,
  CalculateSeniorityTrajectoryComparisonOptions,
  CalculateSeniorityTrajectoryOptions,
  EntryPredicate,
  RetirementCountBucket,
  RetirementCountProjection,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
  SeniorityTrajectoryComparisonPoint,
  SeniorityTrajectoryPoint,
  TrajectoryChange,
} from './seniority-analysis/math'

export {
  calculateAdditionalSeniorityPilots,
  DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS,
} from './seniority-analysis/growth'
export type { GrowthAssumptions } from './seniority-analysis/growth'

export { createSenioritySnapshot, getSeniorityEntryValues, InvalidSenioritySnapshotDataError } from './seniority-engine/snapshot'
export { AnchorNotFoundError, createSeniorityLens } from './seniority-engine/lens'
export { createSeniorityScenario } from './seniority-engine/scenario'
export {
  COMPANY_WIDE_QUALIFICATION_SCOPE,
  enumerateQualificationScopes,
} from './seniority-engine/qualification-scope'
export {
  analyzeSeniorityQualificationViewer,
} from './seniority-engine/qual-viewer'
export type {
  AnalyzeQualificationViewerOptions,
  QualificationViewerAnalysis,
  QualificationViewerEntry,
  QualificationViewerStatus,
} from './seniority-engine/qual-viewer'
export type {
  AnchoredSeniorityLens,
  AgeBucket,
  CaptainQualificationThreshold,
  CommonSeniorityLens,
  DemographicsOptions,
  PercentileCrossingOptions,
  PercentileCrossingResult,
  PercentileDensityBucket,
  Qualification,
  QualificationComposition,
  QualificationDistribution,
  QualificationPosition,
  QualificationPositionOptions,
  QualificationScope,
  QualificationStanding,
  RelativeUpcomingRetirement,
  RelativeUpcomingRetirementFilter,
  RetirementCountProjectionOptions,
  RetirementYearAnalysis,
  Scenario,
  ScenarioOptions,
  SeniorityDemographics,
  SeniorityLens,
  SenioritySnapshot,
  SeniorityStanding,
  SeniorityTrajectoryComparisonOptions,
  SeniorityTrajectoryOptions,
  UpcomingRetirement,
  UpcomingRetirementFilter,
  YearsOfServiceBucket,
  YearsOfServiceDistribution,
} from './seniority-engine/types'

export {
  formatQualification,
  formatQualificationScope,
  formatSeniorityCount,
  formatSeniorityRankChange,
  presentAgeBucket,
  presentPercentileCrossing,
  presentQualificationPositions,
  presentRetirementCountProjection,
  presentSeniorityDemographics,
  presentSeniorityTrajectory,
  presentSeniorityTrajectoryComparison,
} from './seniority-analysis/presentation'
export type {
  PresentedQualificationPosition,
  PresentedSeniorityTrajectory,
  PresentedTrajectoryChange,
} from './seniority-analysis/presentation'
