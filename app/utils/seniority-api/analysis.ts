import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { PlainDate } from '~/utils/temporal'
import { createSenioritySnapshot } from '~/utils/seniority-engine/snapshot'
import { createSeniorityLens } from '~/utils/seniority-engine/lens'
import { createSeniorityScenario } from '~/utils/seniority-engine/scenario'
import type {
  AnchoredSeniorityLens,
  DemographicsOptions,
  PercentileCrossingResult,
  QualificationPosition,
  RelativeUpcomingRetirement,
  RetirementCountProjection,
  RetirementYearAnalysis,
  ScenarioOptions,
  SeniorityDemographics,
  SeniorityLens,
  SeniorityStanding,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
  UpcomingRetirement,
} from '~/utils/seniority-engine/types'
import type { GrowthAssumptions } from '../seniority-analysis/growth'
import { analyzeSeniorityQualificationViewer, type QualificationViewerAnalysis } from '~/utils/seniority-engine/qual-viewer'
import { enumerateQualificationScopes, type QualificationScope } from '~/utils/seniority-engine/qualification-scope'
import {
  presentPercentileCrossing,
  presentAnchoredSeniorityDemographics,
  presentQualificationPositions,
  presentRetirementCountProjection,
  presentSeniorityDemographics,
  presentSeniorityQualificationViewer,
  presentSeniorityStanding,
  presentSeniorityTrajectory,
  presentSeniorityTrajectoryComparison,
  type PresentedPercentileCrossing,
  type PresentedQualificationPosition,
  type PresentedRetirementCountProjection,
  type PresentedSeniorityDemographics,
  type PresentedQualificationViewerAnalysis,
  type PresentedSeniorityStanding,
  type PresentedSeniorityTrajectory,
  type PresentedSeniorityTrajectoryComparison,
  formatQualificationScope,
} from '../seniority-analysis/presentation'

export interface CreateSeniorityAnalysisOptions {
  readonly entries: readonly SeniorityEntry[]
  readonly asOfDate: PlainDate
}

export interface SeniorityOutput<TDomain, TPresentation> {
  readonly domain: TDomain
  readonly presentation: TPresentation
}

export interface SeniorityQualificationScopeOption {
  readonly label: string
  readonly scope: QualificationScope
}

export interface SeniorityCatalog {
  readonly bases: readonly string[]
  readonly seats: readonly string[]
  readonly fleets: readonly string[]
  readonly qualificationScopeOptions: readonly SeniorityQualificationScopeOption[]
}

export interface SeniorityQualificationViewerOptions {
  readonly qualificationScope?: QualificationScope
  readonly employeeNumber?: string | null
  readonly insertSelf?: boolean
}

export interface RetirementCountProjectionAnalysisOptions {
  readonly through: PlainDate
  readonly scenario?: ScenarioOptions
}

export interface SeniorityDemographicsAnalysisOptions extends Omit<DemographicsOptions, 'scenario'> {
  readonly scenario?: ScenarioOptions
}

export interface SeniorityTrajectoryAnalysisOptions {
  readonly through: PlainDate
  readonly scenario?: ScenarioOptions
}

export interface SeniorityTrajectoryComparisonAnalysisOptions {
  readonly through: PlainDate
  readonly baselineScenario?: ScenarioOptions
  readonly comparisonScenario?: ScenarioOptions
}

export interface PercentileCrossingAnalysisOptions extends SeniorityTrajectoryAnalysisOptions {
  readonly targetPercentile: number
}

export interface QualificationPositionAnalysisOptions {
  readonly through: PlainDate
  readonly growthAssumptions?: GrowthAssumptions
}

export interface UpcomingRetirementAnalysisOptions {
  readonly through: PlainDate
  readonly qualificationScope?: QualificationScope
}

export interface RelativeUpcomingRetirementAnalysisOptions extends UpcomingRetirementAnalysisOptions {
  readonly seniorOnly?: boolean
}

export interface CommonSeniorityAnalysis {
  readonly catalog: SeniorityCatalog
  qualificationViewer(
    options: SeniorityQualificationViewerOptions,
  ): SeniorityOutput<QualificationViewerAnalysis, PresentedQualificationViewerAnalysis>
  retirementsNext12Months(): number
  retirementYearAnalysis(scenario?: ScenarioOptions): readonly RetirementYearAnalysis[]
  retirementCountProjection(
    options: RetirementCountProjectionAnalysisOptions,
  ): SeniorityOutput<RetirementCountProjection, PresentedRetirementCountProjection>
  demographics(
    options: SeniorityDemographicsAnalysisOptions,
  ): SeniorityOutput<SeniorityDemographics, PresentedSeniorityDemographics>
  upcomingRetirements(options: UpcomingRetirementAnalysisOptions): readonly UpcomingRetirement[]
}

export interface SeniorityAnalysis extends CommonSeniorityAnalysis {
  withAnchor(employeeNumber: string): AnchoredSeniorityAnalysis
}

export interface AnchoredSeniorityAnalysis extends CommonSeniorityAnalysis {
  readonly anchor: Readonly<SeniorityEntry>
  demographics(
    options: SeniorityDemographicsAnalysisOptions,
  ): SeniorityOutput<SeniorityDemographics, PresentedSeniorityDemographics>
  seniorityStanding(): SeniorityOutput<SeniorityStanding, PresentedSeniorityStanding>
  seniorityTrajectory(
    options: SeniorityTrajectoryAnalysisOptions,
  ): SeniorityOutput<SeniorityTrajectory, PresentedSeniorityTrajectory>
  seniorityTrajectoryComparison(
    options: SeniorityTrajectoryComparisonAnalysisOptions,
  ): SeniorityOutput<SeniorityTrajectoryComparison, PresentedSeniorityTrajectoryComparison>
  percentileCrossing(
    options: PercentileCrossingAnalysisOptions,
  ): SeniorityOutput<PercentileCrossingResult | null, PresentedPercentileCrossing>
  qualificationPositions(
    options: QualificationPositionAnalysisOptions,
  ): SeniorityOutput<readonly QualificationPosition[], readonly PresentedQualificationPosition[]>
  relativeUpcomingRetirements(
    options: RelativeUpcomingRetirementAnalysisOptions,
  ): readonly RelativeUpcomingRetirement[]
}

function seniorityOutput<TDomain, TPresentation>(
  domain: TDomain,
  present: (value: TDomain) => TPresentation,
): SeniorityOutput<TDomain, TPresentation> {
  return { domain, presentation: present(domain) }
}

function qualificationScopeOptions(entries: readonly SeniorityEntry[]): readonly SeniorityQualificationScopeOption[] {
  return enumerateQualificationScopes(entries).map(scope => ({ scope, label: formatQualificationScope(scope) }))
}

function commonSeniorityAnalysis(
  lens: SeniorityLens | AnchoredSeniorityLens,
  asOfDate: PlainDate,
): CommonSeniorityAnalysis {
  const entries = lens.snapshot.entries
  return {
    catalog: {
      bases: lens.snapshot.bases,
      seats: lens.snapshot.seats,
      fleets: lens.snapshot.fleets,
      qualificationScopeOptions: qualificationScopeOptions(entries),
    },
    qualificationViewer: (options) => {
      const domain = analyzeSeniorityQualificationViewer({ ...options, entries, asOfDate })
      return seniorityOutput(domain, value => presentSeniorityQualificationViewer(value, asOfDate))
    },
    retirementsNext12Months: () => lens.retirementsNext12Months(),
    retirementYearAnalysis: scenario => lens.retirementYearAnalysis(createSeniorityScenario(scenario)),
    retirementCountProjection: (options) => {
      const domain = lens.retirementCountProjection({
        through: options.through,
        scenario: createSeniorityScenario(options.scenario),
      })
      return seniorityOutput(domain, presentRetirementCountProjection)
    },
    demographics: (options) => {
      const domain = lens.demographics({
        mandatoryRetirementAge: options.mandatoryRetirementAge,
        scenario: createSeniorityScenario(options.scenario),
      })
      return seniorityOutput(domain, presentSeniorityDemographics)
    },
    upcomingRetirements: options => lens.upcomingRetirements(options),
  }
}

function anchoredSeniorityAnalysis(lens: AnchoredSeniorityLens, asOfDate: PlainDate): AnchoredSeniorityAnalysis {
  return {
    ...commonSeniorityAnalysis(lens, asOfDate),
    anchor: lens.anchor,
    demographics: (options) => {
      const scenario = createSeniorityScenario(options.scenario)
      const domain = lens.demographics({
        mandatoryRetirementAge: options.mandatoryRetirementAge,
        scenario,
      })
      const positions = lens.qualificationPositions({
        through: asOfDate,
        growthAssumptions: scenario.growthAssumptions,
      })
      return seniorityOutput(domain, value => presentAnchoredSeniorityDemographics(value, positions))
    },
    seniorityStanding: () => seniorityOutput(lens.seniorityStanding(), presentSeniorityStanding),
    seniorityTrajectory: (options) => {
      const domain = lens.seniorityTrajectory({
        through: options.through,
        scenario: createSeniorityScenario(options.scenario),
      })
      return seniorityOutput(domain, presentSeniorityTrajectory)
    },
    seniorityTrajectoryComparison: (options) => {
      const domain = lens.seniorityTrajectoryComparison({
        through: options.through,
        baselineScenario: createSeniorityScenario(options.baselineScenario),
        comparisonScenario: createSeniorityScenario(options.comparisonScenario),
      })
      return seniorityOutput(domain, presentSeniorityTrajectoryComparison)
    },
    percentileCrossing: (options) => {
      const domain = lens.percentileCrossing({
        through: options.through,
        targetPercentile: options.targetPercentile,
        scenario: createSeniorityScenario(options.scenario),
      })
      return seniorityOutput(domain, presentPercentileCrossing)
    },
    qualificationPositions: (options) => {
      const domain = lens.qualificationPositions(options)
      return seniorityOutput(domain, presentQualificationPositions)
    },
    relativeUpcomingRetirements: options => lens.relativeUpcomingRetirements(options),
  }
}

/** Creates one deep Seniority Analysis module for an immutable entry set and As-of Date. */
export function createSeniorityAnalysis(options: CreateSeniorityAnalysisOptions): SeniorityAnalysis {
  const lens = createSeniorityLens(createSenioritySnapshot(options.entries), { asOfDate: options.asOfDate })
  return {
    ...commonSeniorityAnalysis(lens, options.asOfDate),
    withAnchor: employeeNumber => anchoredSeniorityAnalysis(lens.withAnchor(employeeNumber), options.asOfDate),
  }
}
