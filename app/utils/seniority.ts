/** Deep public interface for Seniority Analysis. */
export {
  createSeniorityAnalysis,
} from './seniority-api/analysis'
export type {
  AnchoredSeniorityAnalysis,
  CommonSeniorityAnalysis,
  CreateSeniorityAnalysisOptions,
  PercentileCrossingAnalysisOptions,
  QualificationPositionAnalysisOptions,
  RelativeUpcomingRetirementAnalysisOptions,
  RetirementCountProjectionAnalysisOptions,
  SeniorityAnalysis,
  SeniorityCatalog,
  SeniorityDemographicsAnalysisOptions,
  SeniorityOutput,
  SeniorityQualificationScopeOption,
  SeniorityQualificationViewerOptions,
  SeniorityStandingAnalysisOptions,
  SeniorityTrajectoryAnalysisOptions,
  SeniorityTrajectoryComparisonAnalysisOptions,
  UpcomingRetirementAnalysisOptions,
} from './seniority-api/analysis'

export { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS } from './seniority-analysis/growth'
export type { GrowthAssumptions } from './seniority-analysis/growth'

export { formatGrowthAssumptions } from './seniority-analysis/presentation'
export { isNoResult, resultOrNull } from './seniority-engine/types'
export { AnchorNotFoundError } from './seniority-engine/lens'
export { InvalidSenioritySnapshotDataError } from './seniority-engine/snapshot'
export type {
  QualificationViewerAnalysis,
  QualificationViewerEntry,
  QualificationViewerStatus,
} from './seniority-engine/qual-viewer'
export type {
  NoResult,
  NoResultReason,
  QualificationScope,
  RelativeUpcomingRetirement,
  UpcomingRetirement,
} from './seniority-engine/types'
export type {
  PresentedPercentileCrossing,
  PresentedQualificationPosition,
  PresentedQualificationViewerAnalysis,
  PresentedQualificationViewerEntry,
  PresentedRetirementCountProjection,
  PresentedSeniorityDemographics,
  PresentedSeniorityStanding,
  PresentedSeniorityTrajectory,
  PresentedSeniorityTrajectoryComparison,
  PresentedTrajectoryChange,
} from './seniority-analysis/presentation'
