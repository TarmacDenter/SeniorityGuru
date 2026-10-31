import type {
  AnchoredSeniorityLens,
  EntryPredicate,
  CommonSeniorityLens,
  DemographicsOptions,
  NoResult,
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
import { isNoResult } from './types'
import { memoizeLast, stableStringify } from './memoize'
import type { QualificationScope } from './qualification-scope'
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
  /** Employee number of a modeled New Hire entry in the snapshot; counted in Roster Size, not in the publication count. */
  readonly modeledEmployeeNumber?: string
}

export class AnchorNotFoundError extends Error {
  constructor(readonly employeeNumber: string) {
    super(`No seniority entry exists for employee number "${employeeNumber}".`)
    this.name = 'AnchorNotFoundError'
  }
}

const ANCHOR_RETIRED: NoResult = { kind: 'no-result', reason: 'anchor-retired', label: 'Anchor Pilot retired' }

interface LensContext {
  readonly snapshot: SenioritySnapshot
  readonly modeledEmployeeNumber: string | null
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

function createLensContext(
  snapshot: SenioritySnapshot,
  date: Temporal.PlainDate,
  modeledEmployeeNumber: string | null,
): LensContext {
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
    modeledEmployeeNumber,
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
  readonly seniorityStanding: AnchoredSeniorityLens['seniorityStanding']
  readonly seniorityTrajectory: AnchoredSeniorityLens['seniorityTrajectory']
  readonly seniorityTrajectoryComparison: AnchoredSeniorityLens['seniorityTrajectoryComparison']
  readonly percentileCrossing: AnchoredSeniorityLens['percentileCrossing']
  readonly qualificationPositions: AnchoredSeniorityLens['qualificationPositions']
  readonly relativeUpcomingRetirements: (filter: RelativeUpcomingRetirementFilter) => readonly RelativeUpcomingRetirement[]

  constructor(private readonly context: LensContext, readonly anchor: Readonly<SeniorityEntry>) {
    this.common = commonLensMethods(context)
    const entries = context.snapshot.entries
    const seniorityNumber = anchor.seniority_number
    /** Dynamic Rank: Publication Position minus pilots senior to the given number who have already retired. */
    const dynamicRank = (number: number): number =>
      calculateSeniorityRank(entries, number) - countRetiredPilotsSeniorTo(entries, number, asOfDate(context))
    const anchorDynamicRank = dynamicRank(seniorityNumber)

    /** Only a retired Anchor Pilot has no result; an out-of-scope Anchor Pilot gets a Hypothetical Placement. */
    const noResultFor = (date: Temporal.PlainDate): NoResult | null =>
      anchor.retire_date && isRetiredBy(anchor.retire_date, date) ? ANCHOR_RETIRED : null
    /** Hypothetical Placement: the Anchor Pilot is outside the scope and is slotted in by Seniority Number. */
    const isHypothetical = (scope: QualificationScope): boolean => !qualificationScopeToEntryPredicate(scope)(anchor)
    /** The scope's members plus the Anchor Pilot, so Rank, Roster Size and growth share one population. */
    const scopePredicateIncludingAnchor = (scope: QualificationScope): EntryPredicate => {
      const inScope = qualificationScopeToEntryPredicate(scope)
      return entry => entry.seniority_number === seniorityNumber || inScope(entry)
    }
    const endedBy = (through: Temporal.PlainDate): NoResult | undefined =>
      anchor.retire_date && isRetiredBy(anchor.retire_date, through) ? ANCHOR_RETIRED : undefined

    this.seniorityStanding = memoizeLast((options) => {
      const today = asOfDate(context)
      const scenario = options?.scenario ?? createSeniorityScenario()
      const unavailable = noResultFor(today)
      if (unavailable) return unavailable
      const scopedEntries = entries.filter(scopePredicateIncludingAnchor(scenario.qualificationScope))
      const publicationPosition = calculateSeniorityRank(scopedEntries, seniorityNumber)
      const retiredPilotsSeniorToAnchor = countRetiredPilotsSeniorTo(scopedEntries, seniorityNumber, today)
      const inScope = qualificationScopeToEntryPredicate(scenario.qualificationScope)
      const publicationPilotCount = entries.filter(entry =>
        inScope(entry) && normalizeEmployeeNumber(entry.employee_number) !== context.modeledEmployeeNumber,
      ).length
      const qualificationStandings: QualificationStanding[] = []

      for (const qualificationEntries of context.snapshot.entriesByQualification.values()) {
        const first = qualificationEntries[0]!
        const isAnchorCurrentQualification =
          anchor.base === first.base && anchor.seat === first.seat && anchor.fleet === first.fleet
        const modeledAnchorCount = isAnchorCurrentQualification ? 0 : 1
        const rosterSize = qualificationEntries.length + modeledAnchorCount
        const retiredPilotCount = qualificationEntries.filter(entry =>
          entry.retire_date && isRetiredBy(entry.retire_date, today),
        ).length
        const qualificationPublicationPosition = calculateSeniorityRank(qualificationEntries, seniorityNumber)
        const rank = qualificationPublicationPosition - countRetiredPilotsSeniorTo(
          qualificationEntries,
          seniorityNumber,
          today,
        )
        qualificationStandings.push({
          qualification: { base: first.base, seat: first.seat, fleet: first.fleet },
          rank,
          publicationPosition: qualificationPublicationPosition,
          rosterSize,
          activePilotCount: rosterSize - retiredPilotCount,
          seniorityPercentile: calculateSeniorityPercentile(rank, rosterSize),
          isAnchorCurrentQualification,
          isHypothetical: !isAnchorCurrentQualification,
        })
      }

      const scopedRetiredCount = scopedEntries.filter(entry =>
        entry.retire_date && isRetiredBy(entry.retire_date, today),
      ).length
      const rank = publicationPosition - retiredPilotsSeniorToAnchor
      const retiringWithinNextYear = entries.filter(entry =>
        inScope(entry) && !!entry.retire_date && retiresWithinNextYear(entry.retire_date.toString(), today.toString()),
      )
      const rollingNext12MonthRetirementsSeniorToAnchor = retiringWithinNextYear.filter(entry =>
        entry.seniority_number < seniorityNumber,
      ).length

      return {
        rank,
        publicationPosition,
        rosterSize: scopedEntries.length,
        publicationPilotCount,
        activePilotCount: scopedEntries.length - scopedRetiredCount,
        seniorityPercentile: calculateSeniorityPercentile(rank, scopedEntries.length),
        retiredPilotsSeniorToAnchor,
        rollingNext12MonthRetirements: retiringWithinNextYear.length,
        rollingNext12MonthRetirementsSeniorToAnchor,
        qualificationStandings,
        isHypothetical: isHypothetical(scenario.qualificationScope),
      }
    }, options => `seniority-standing:${stableStringify(options?.scenario?.qualificationScope ?? {})}`)

    this.seniorityTrajectory = memoizeLast((options) => {
      const scenario = options.scenario ?? createSeniorityScenario()
      const unavailable = noResultFor(asOfDate(context))
      if (unavailable) return unavailable
      const trajectory = calculateSeniorityTrajectory({
        entries,
        seniorityNumber,
        from: asOfDate(context),
        through: options.through,
        predicate: scopePredicateIncludingAnchor(scenario.qualificationScope),
        growthAssumptions: scenario.growthAssumptions,
        anchorRetireDate: anchor.retire_date ?? undefined,
      })
      return { ...trajectory, endedBy: endedBy(options.through), isHypothetical: isHypothetical(scenario.qualificationScope) }
    })

    this.seniorityTrajectoryComparison = memoizeLast((options) => {
      const unavailable = noResultFor(asOfDate(context))
      if (unavailable) return unavailable
      const comparison = calculateSeniorityTrajectoryComparison({
        entries,
        seniorityNumber,
        from: asOfDate(context),
        through: options.through,
        baselinePredicate: scopePredicateIncludingAnchor(options.baselineScenario.qualificationScope),
        comparisonPredicate: scopePredicateIncludingAnchor(options.comparisonScenario.qualificationScope),
        baselineGrowthAssumptions: options.baselineScenario.growthAssumptions,
        comparisonGrowthAssumptions: options.comparisonScenario.growthAssumptions,
        anchorRetireDate: anchor.retire_date ?? undefined,
      })
      return {
        ...comparison,
        endedBy: endedBy(options.through),
        baselineIsHypothetical: isHypothetical(options.baselineScenario.qualificationScope),
        comparisonIsHypothetical: isHypothetical(options.comparisonScenario.qualificationScope),
      }
    })

    this.percentileCrossing = memoizeLast((options) => {
      const trajectory = this.seniorityTrajectory({ through: options.through, scenario: options.scenario })
      if (isNoResult(trajectory)) return trajectory
      return findPercentileCrossing(trajectory.points, options.targetPercentile)
    })

    this.qualificationPositions = memoizeLast((options) => {
      const unavailable = noResultFor(asOfDate(context))
      if (unavailable) return unavailable
      return analyzeQualificationPositions(
        entries,
        seniorityNumber,
        asOfDate(context),
        options.through,
        options.growthAssumptions,
      )
    })

    this.relativeUpcomingRetirements = memoizeLast(filter => context.upcomingRetirements(filter)
      .map(row => ({
        ...row,
        positionsSeniorToAnchor:
          anchorDynamicRank - dynamicRank(row.seniorityNumber),
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
  const modeledEmployeeNumber = options.modeledEmployeeNumber
    ? normalizeEmployeeNumber(options.modeledEmployeeNumber)
    : null
  return new SeniorityLensImplementation(createLensContext(snapshot, options.asOfDate, modeledEmployeeNumber))
}
