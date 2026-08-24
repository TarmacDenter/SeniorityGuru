import type {
  AnchoredSeniorityLens,
  CommonSeniorityLens,
  DemographicsOptions,
  PercentileCrossingOptions,
  PercentileCrossingResult,
  QualificationPosition,
  QualificationPositionOptions,
  QualificationStanding,
  RelativeUpcomingRetirement,
  RelativeUpcomingRetirementFilter,
  RetirementCountProjection,
  RetirementCountProjectionOptions,
  RetirementYearAnalysis,
  Scenario,
  SeniorityDemographics,
  SeniorityLens,
  SenioritySnapshot,
  SeniorityStanding,
  SeniorityTrajectory,
  SeniorityTrajectoryComparison,
  SeniorityTrajectoryComparisonOptions,
  SeniorityTrajectoryOptions,
  UpcomingRetirement,
  UpcomingRetirementFilter,
} from './types'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'
import {
  calculateRetirementCountProjection,
  calculateSeniorityPercentile,
  calculateSeniorityRank,
  calculateSeniorityTrajectory,
  calculateSeniorityTrajectoryComparison,
  countRetiredPilotsSeniorTo,
} from '~/utils/seniority-analysis/math'
import { createSeniorityScenario } from './scenario'
import { memoizeLast } from './memoize'
import { qualificationScopeToEntryPredicate } from './qualification-scope'
import {
  analyzeAgeDistribution,
  analyzeQualificationComposition,
  analyzeYearsOfServiceBuckets,
  analyzeYearsOfServiceDistribution,
  findCaptainQualificationThresholds,
} from './demographics'
import { analyzeRetirementYears } from './retirement-analysis'
import { analyzeQualificationPositions } from './qualification-position'
import { findPercentileCrossing } from './trajectory-analysis'
import { isRetiredBy, retiresWithinNextYear } from '~/utils/date'
import { Temporal } from '~/utils/temporal'

export interface CreateSeniorityLensOptions {
  readonly asOfDate: Temporal.PlainDate
}

export class AnchorNotFoundError extends Error {
  constructor(readonly employeeNumber: string) {
    super(`No seniority entry exists for employee number "${employeeNumber}".`)
    this.name = 'AnchorNotFoundError'
  }
}

interface LensContext {
  readonly snapshot: SenioritySnapshot
  readonly asOfDateISO: string
  readonly retirementsNext12Months: () => number
  readonly retirementYearAnalysis: (scenario?: Scenario) => readonly RetirementYearAnalysis[]
  readonly retirementCountProjection: (options: RetirementCountProjectionOptions) => RetirementCountProjection
  readonly demographics: (options: DemographicsOptions) => SeniorityDemographics
  readonly upcomingRetirements: (filter: UpcomingRetirementFilter) => readonly UpcomingRetirement[]
}

function asOfDate(context: LensContext): Temporal.PlainDate {
  return Temporal.PlainDate.from(context.asOfDateISO)
}

function createLensContext(snapshot: SenioritySnapshot, date: Temporal.PlainDate): LensContext {
  const entries = snapshot.entries
  const dateISO = date.toString()
  const currentDate = () => Temporal.PlainDate.from(dateISO)

  const retirementsNext12Months = () => entries.filter(entry =>
    !!entry.retire_date
    && retiresWithinNextYear(entry.retire_date.toString(), currentDate().toString()),
  ).length

  const retirementYearAnalysis = (scenario?: Scenario) => {
    const effectiveScenario = scenario ?? createSeniorityScenario()
    return analyzeRetirementYears(entries, qualificationScopeToEntryPredicate(effectiveScenario.qualificationScope))
  }

  const retirementCountProjection = (options: RetirementCountProjectionOptions) => {
    const effectiveScenario = options.scenario ?? createSeniorityScenario()
    return calculateRetirementCountProjection({
      entries,
      from: currentDate(),
      through: options.through,
      predicate: qualificationScopeToEntryPredicate(effectiveScenario.qualificationScope),
    })
  }

  const demographics = (options: DemographicsOptions): SeniorityDemographics => {
    const effectiveScenario = options.scenario ?? createSeniorityScenario()
    const predicate = qualificationScopeToEntryPredicate(effectiveScenario.qualificationScope)
    const scopedEntries = entries.filter(predicate)
    return {
      ageDistribution: analyzeAgeDistribution(entries, options.mandatoryRetirementAge, predicate, currentDate()),
      yearsOfServiceDistribution: analyzeYearsOfServiceDistribution(entries, predicate, currentDate()),
      yearsOfServiceBuckets: analyzeYearsOfServiceBuckets(entries, predicate, currentDate()),
      qualificationComposition: analyzeQualificationComposition(scopedEntries),
      captainQualificationThresholds: findCaptainQualificationThresholds(scopedEntries, currentDate()),
    }
  }

  const upcomingRetirements = (filter: UpcomingRetirementFilter): readonly UpcomingRetirement[] => {
    const today = currentDate()
    const predicate = qualificationScopeToEntryPredicate(filter.qualificationScope ?? {})
    return entries
      .filter(entry =>
        !!entry.retire_date
        && !isRetiredBy(entry.retire_date, today)
        && isRetiredBy(entry.retire_date, filter.through)
        && predicate(entry),
      )
      .toSorted((a, b) => Temporal.PlainDate.compare(a.retire_date!, b.retire_date!))
      .map(entry => ({
        seniorityNumber: entry.seniority_number,
        employeeNumber: entry.employee_number,
        qualification: { base: entry.base, seat: entry.seat, fleet: entry.fleet },
        retirementDate: entry.retire_date!,
      }))
  }

  return {
    snapshot,
    asOfDateISO: dateISO,
    retirementsNext12Months: memoizeLast(retirementsNext12Months, () => 'retirements-next-12-months'),
    retirementYearAnalysis: memoizeLast(retirementYearAnalysis),
    retirementCountProjection: memoizeLast(retirementCountProjection),
    demographics: memoizeLast(demographics),
    upcomingRetirements: memoizeLast(upcomingRetirements),
  }
}

function commonLensMethods(context: LensContext): Omit<CommonSeniorityLens, 'snapshot'> {
  return {
    retirementsNext12Months: () => context.retirementsNext12Months(),
    retirementYearAnalysis: scenario => context.retirementYearAnalysis(scenario),
    retirementCountProjection: options => context.retirementCountProjection(options),
    demographics: options => context.demographics(options),
    upcomingRetirements: filter => context.upcomingRetirements(filter),
  }
}

class SeniorityLensImplementation implements SeniorityLens {
  private readonly common: Omit<CommonSeniorityLens, 'snapshot'>

  constructor(private readonly context: LensContext) {
    this.common = commonLensMethods(context)
  }

  get snapshot(): SenioritySnapshot {
    return this.context.snapshot
  }

  readonly retirementsNext12Months = () => this.common.retirementsNext12Months()
  readonly retirementYearAnalysis = (scenario?: Scenario) => this.common.retirementYearAnalysis(scenario)
  readonly retirementCountProjection = (options: RetirementCountProjectionOptions) => this.common.retirementCountProjection(options)
  readonly demographics = (options: DemographicsOptions) => this.common.demographics(options)
  readonly upcomingRetirements = (filter: UpcomingRetirementFilter) => this.common.upcomingRetirements(filter)

  withAnchor(employeeNumber: string): AnchoredSeniorityLens {
    const anchor = this.context.snapshot.entriesByEmployeeNumber.get(normalizeEmployeeNumber(employeeNumber))
    if (!anchor) throw new AnchorNotFoundError(employeeNumber)
    return new AnchoredSeniorityLensImplementation(this.context, anchor)
  }
}

class AnchoredSeniorityLensImplementation implements AnchoredSeniorityLens {
  private readonly common: Omit<CommonSeniorityLens, 'snapshot'>
  readonly seniorityStanding: () => SeniorityStanding
  readonly seniorityTrajectory: (options: SeniorityTrajectoryOptions) => SeniorityTrajectory
  readonly seniorityTrajectoryComparison: (options: SeniorityTrajectoryComparisonOptions) => SeniorityTrajectoryComparison
  readonly percentileCrossing: (options: PercentileCrossingOptions) => PercentileCrossingResult | null
  readonly qualificationPositions: (options: QualificationPositionOptions) => readonly QualificationPosition[]
  readonly relativeUpcomingRetirements: (filter: RelativeUpcomingRetirementFilter) => readonly RelativeUpcomingRetirement[]

  constructor(private readonly context: LensContext, readonly anchor: Readonly<SeniorityEntry>) {
    this.common = commonLensMethods(context)
    const entries = context.snapshot.entries
    const seniorityNumber = anchor.seniority_number
    const anchorListRank = calculateSeniorityRank(entries, seniorityNumber)

    this.seniorityStanding = memoizeLast(() => {
      const today = asOfDate(context)
      const listRank = calculateSeniorityRank(entries, seniorityNumber)
      const retiredPilotsSeniorToAnchor = countRetiredPilotsSeniorTo(entries, seniorityNumber, today)
      const qualificationStandings: QualificationStanding[] = []

      for (const qualificationEntries of context.snapshot.entriesByQualification.values()) {
        const first = qualificationEntries[0]!
        const listPilotCount = qualificationEntries.length
        const retiredPilotCount = qualificationEntries.filter(entry =>
          entry.retire_date && isRetiredBy(entry.retire_date, today),
        ).length
        const activePilotCount = listPilotCount - retiredPilotCount
        const qualificationListRank = calculateSeniorityRank(qualificationEntries, seniorityNumber)
        const retiredQualificationPilotsSeniorToAnchor = countRetiredPilotsSeniorTo(
          qualificationEntries,
          seniorityNumber,
          today,
        )
        const activeRank = qualificationListRank - retiredQualificationPilotsSeniorToAnchor
        qualificationStandings.push({
          qualification: { base: first.base, seat: first.seat, fleet: first.fleet },
          listRank: qualificationListRank,
          activeRank,
          listPilotCount,
          activePilotCount,
          listPercentile: calculateSeniorityPercentile(qualificationListRank, listPilotCount),
          activePercentile: calculateSeniorityPercentile(activeRank, activePilotCount),
          isAnchorCurrentQualification:
            anchor.base === first.base && anchor.seat === first.seat && anchor.fleet === first.fleet,
        })
      }

      const activePilotCount = qualificationStandings.reduce((sum, standing) => sum + standing.activePilotCount, 0)
      const activeRank = listRank - retiredPilotsSeniorToAnchor
      const rollingNext12MonthRetirementsSeniorToAnchor = entries.filter(entry =>
        entry.seniority_number < seniorityNumber
        && !!entry.retire_date
        && retiresWithinNextYear(entry.retire_date.toString(), today.toString()),
      ).length

      return {
        listRank,
        activeRank,
        listPilotCount: entries.length,
        activePilotCount,
        listPercentile: calculateSeniorityPercentile(listRank, entries.length),
        activePercentile: calculateSeniorityPercentile(activeRank, activePilotCount),
        retiredPilotsSeniorToAnchor,
        rollingNext12MonthRetirements: context.retirementsNext12Months(),
        rollingNext12MonthRetirementsSeniorToAnchor,
        qualificationStandings,
      }
    }, () => 'seniority-standing')

    this.seniorityTrajectory = memoizeLast((options) => {
      const scenario = options.scenario ?? createSeniorityScenario()
      return calculateSeniorityTrajectory({
        entries,
        seniorityNumber,
        from: asOfDate(context),
        through: options.through,
        predicate: qualificationScopeToEntryPredicate(scenario.qualificationScope),
        growthAssumptions: scenario.growthAssumptions,
      })
    })

    this.seniorityTrajectoryComparison = memoizeLast(options => calculateSeniorityTrajectoryComparison({
      entries,
      seniorityNumber,
      from: asOfDate(context),
      through: options.through,
      baselinePredicate: qualificationScopeToEntryPredicate(options.baselineScenario.qualificationScope),
      comparisonPredicate: qualificationScopeToEntryPredicate(options.comparisonScenario.qualificationScope),
      baselineGrowthAssumptions: options.baselineScenario.growthAssumptions,
      comparisonGrowthAssumptions: options.comparisonScenario.growthAssumptions,
    }))

    this.percentileCrossing = memoizeLast((options) => {
      const trajectory = this.seniorityTrajectory({ through: options.through, scenario: options.scenario })
      return findPercentileCrossing(trajectory.points, options.targetPercentile)
    })

    this.qualificationPositions = memoizeLast(options => analyzeQualificationPositions(
      entries,
      seniorityNumber,
      asOfDate(context),
      options.through,
      options.growthAssumptions,
    ))

    this.relativeUpcomingRetirements = memoizeLast(filter => context.upcomingRetirements(filter)
      .map(row => ({
        ...row,
        positionsSeniorToAnchor:
          anchorListRank - calculateSeniorityRank(entries, row.seniorityNumber),
      }))
      .filter(row => !filter.seniorOnly || row.positionsSeniorToAnchor > 0))
  }

  get snapshot(): SenioritySnapshot {
    return this.context.snapshot
  }

  readonly retirementsNext12Months = () => this.common.retirementsNext12Months()
  readonly retirementYearAnalysis = (scenario?: Scenario) => this.common.retirementYearAnalysis(scenario)
  readonly retirementCountProjection = (options: RetirementCountProjectionOptions) => this.common.retirementCountProjection(options)
  readonly demographics = (options: DemographicsOptions) => this.common.demographics(options)
  readonly upcomingRetirements = (filter: UpcomingRetirementFilter) => this.common.upcomingRetirements(filter)
}

export function createSeniorityLens(
  snapshot: SenioritySnapshot,
  options: CreateSeniorityLensOptions,
): SeniorityLens {
  return new SeniorityLensImplementation(createLensContext(snapshot, options.asOfDate))
}
