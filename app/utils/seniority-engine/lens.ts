import type {
  AnchoredSeniorityLens,
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
}

export class AnchorNotFoundError extends Error {
  constructor(readonly employeeNumber: string) {
    super(`No seniority entry exists for employee number "${employeeNumber}".`)
    this.name = 'AnchorNotFoundError'
  }
}

const ANCHOR_RETIRED: NoResult = { kind: 'no-result', reason: 'anchor-retired', label: 'Anchor Pilot retired' }
const ANCHOR_NOT_IN_SCOPE: NoResult = { kind: 'no-result', reason: 'anchor-not-in-scope', label: 'Anchor Pilot not in scope' }

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

    /** Scope is judged before retirement: an out-of-scope Anchor Pilot has no Rank in the scope at all. */
    const noResultFor = (scope: QualificationScope, date: Temporal.PlainDate): NoResult | null => {
      if (!qualificationScopeToEntryPredicate(scope)(anchor)) return ANCHOR_NOT_IN_SCOPE
      if (anchor.retire_date && isRetiredBy(anchor.retire_date, date)) return ANCHOR_RETIRED
      return null
    }
    const endedBy = (through: Temporal.PlainDate): NoResult | undefined =>
      anchor.retire_date && isRetiredBy(anchor.retire_date, through) ? ANCHOR_RETIRED : undefined

    this.seniorityStanding = memoizeLast((options) => {
      const today = asOfDate(context)
      const scenario = options?.scenario ?? createSeniorityScenario()
      const unavailable = noResultFor(scenario.qualificationScope, today)
      if (unavailable) return unavailable
      const scopedEntries = entries.filter(qualificationScopeToEntryPredicate(scenario.qualificationScope))
      const publicationPosition = calculateSeniorityRank(scopedEntries, seniorityNumber)
      const retiredPilotsSeniorToAnchor = countRetiredPilotsSeniorTo(scopedEntries, seniorityNumber, today)
      const qualificationStandings: QualificationStanding[] = []

      for (const qualificationEntries of context.snapshot.entriesByQualification.values()) {
        const first = qualificationEntries[0]!
        const rosterSize = qualificationEntries.length
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
          isAnchorCurrentQualification:
            anchor.base === first.base && anchor.seat === first.seat && anchor.fleet === first.fleet,
        })
      }

      const scopedRetiredCount = scopedEntries.filter(entry =>
        entry.retire_date && isRetiredBy(entry.retire_date, today),
      ).length
      const rank = publicationPosition - retiredPilotsSeniorToAnchor
      const rollingNext12MonthRetirementsSeniorToAnchor = entries.filter(entry =>
        entry.seniority_number < seniorityNumber
        && !!entry.retire_date
        && retiresWithinNextYear(entry.retire_date.toString(), today.toString()),
      ).length

      return {
        rank,
        publicationPosition,
        rosterSize: scopedEntries.length,
        activePilotCount: scopedEntries.length - scopedRetiredCount,
        seniorityPercentile: calculateSeniorityPercentile(rank, scopedEntries.length),
        retiredPilotsSeniorToAnchor,
        rollingNext12MonthRetirements: context.retirementsNext12Months(),
        rollingNext12MonthRetirementsSeniorToAnchor,
        qualificationStandings,
      }
    }, options => `seniority-standing:${stableStringify(options?.scenario?.qualificationScope ?? {})}`)

    this.seniorityTrajectory = memoizeLast((options) => {
      const scenario = options.scenario ?? createSeniorityScenario()
      const unavailable = noResultFor(scenario.qualificationScope, asOfDate(context))
      if (unavailable) return unavailable
      const trajectory = calculateSeniorityTrajectory({
        entries,
        seniorityNumber,
        from: asOfDate(context),
        through: options.through,
        predicate: qualificationScopeToEntryPredicate(scenario.qualificationScope),
        growthAssumptions: scenario.growthAssumptions,
        anchorRetireDate: anchor.retire_date ?? undefined,
      })
      return { ...trajectory, endedBy: endedBy(options.through) }
    })

    this.seniorityTrajectoryComparison = memoizeLast((options) => {
      const unavailable = noResultFor(options.baselineScenario.qualificationScope, asOfDate(context))
        ?? noResultFor(options.comparisonScenario.qualificationScope, asOfDate(context))
      if (unavailable) return unavailable
      const comparison = calculateSeniorityTrajectoryComparison({
        entries,
        seniorityNumber,
        from: asOfDate(context),
        through: options.through,
        baselinePredicate: qualificationScopeToEntryPredicate(options.baselineScenario.qualificationScope),
        comparisonPredicate: qualificationScopeToEntryPredicate(options.comparisonScenario.qualificationScope),
        baselineGrowthAssumptions: options.baselineScenario.growthAssumptions,
        comparisonGrowthAssumptions: options.comparisonScenario.growthAssumptions,
        anchorRetireDate: anchor.retire_date ?? undefined,
      })
      return { ...comparison, endedBy: endedBy(options.through) }
    })

    this.percentileCrossing = memoizeLast((options) => {
      const trajectory = this.seniorityTrajectory({ through: options.through, scenario: options.scenario })
      if (isNoResult(trajectory)) return trajectory
      return findPercentileCrossing(trajectory.points, options.targetPercentile)
    })

    this.qualificationPositions = memoizeLast((options) => {
      const unavailable = noResultFor(options.qualificationScope ?? {}, asOfDate(context))
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
  return new SeniorityLensImplementation(createLensContext(snapshot, options.asOfDate))
}
