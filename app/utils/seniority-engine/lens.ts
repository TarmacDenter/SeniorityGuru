import type {
  AnchoredSeniorityLens,
  AnchoredRetirementCountProjection,
  EntryPredicate,
  CommonSeniorityLens,
  DemographicsOptions,
  NoResult,
  QualificationStanding,
  RelativeUpcomingRetirement,
  RelativeUpcomingRetirementFilter,
  RetirementCountProjectionOptions,
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
import { analyzeHoldabilityDetail, analyzeQualificationPositions } from './qualification-position'
import { findPercentileCrossing } from './trajectory-analysis'
import { computeYOSDate, isRetiredBy, retiresWithinNextYear } from '~/utils/date'
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

/** What every lens operation reads: the roster, the As-of Date, and the modeled New Hire pilot. */
interface LensContext {
  readonly snapshot: SenioritySnapshot
  readonly modeledEmployeeNumber: string | null
  readonly asOfDate: Temporal.PlainDate
}

/** The operations shared by both lenses, memoized per lens. */
function createCommonLens(context: LensContext): CommonSeniorityLens {
  const { snapshot, asOfDate } = context
  const entries = snapshot.entries

  const retirementsNext12Months = () => entries.filter(entry =>
    !!entry.retire_date
    && retiresWithinNextYear(entry.retire_date.toString(), asOfDate.toString()),
  ).length

  const retirementYearAnalysis = (scenario?: Scenario) => {
    const effectiveScenario = scenario ?? createSeniorityScenario()
    return analyzeRetirementYears(entries, qualificationScopeToEntryPredicate(effectiveScenario.qualificationScope))
  }

  const retirementCountProjection = (options: RetirementCountProjectionOptions) => {
    const effectiveScenario = options.scenario ?? createSeniorityScenario()
    return calculateRetirementCountProjection({
      entries,
      from: asOfDate,
      through: options.through,
      predicate: qualificationScopeToEntryPredicate(effectiveScenario.qualificationScope),
    })
  }

  const demographics = (options: DemographicsOptions): SeniorityDemographics => {
    const effectiveScenario = options.scenario ?? createSeniorityScenario()
    const predicate = qualificationScopeToEntryPredicate(effectiveScenario.qualificationScope)
    const scopedEntries = entries.filter(predicate)
    return {
      matchingPilotCount: scopedEntries.length,
      ageDistribution: analyzeAgeDistribution(entries, options.mandatoryRetirementAge, predicate, asOfDate),
      yearsOfServiceDistribution: analyzeYearsOfServiceDistribution(entries, predicate, asOfDate),
      yearsOfServiceBuckets: analyzeYearsOfServiceBuckets(entries, predicate, asOfDate),
      qualificationComposition: analyzeQualificationComposition(scopedEntries),
      captainQualificationThresholds: findCaptainQualificationThresholds(scopedEntries, asOfDate),
    }
  }

  const upcomingRetirements = (filter: UpcomingRetirementFilter): readonly UpcomingRetirement[] => {
    const start = filter.from ?? asOfDate
    const predicate = qualificationScopeToEntryPredicate(filter.qualificationScope ?? {})
    return entries
      .filter(entry =>
        !!entry.retire_date
        && !isRetiredBy(entry.retire_date, start)
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
    retirementsNext12Months: memoizeLast(retirementsNext12Months, () => 'retirements-next-12-months'),
    retirementYearAnalysis: memoizeLast(retirementYearAnalysis),
    retirementCountProjection: memoizeLast(retirementCountProjection),
    demographics: memoizeLast(demographics),
    upcomingRetirements: memoizeLast(upcomingRetirements),
  }
}

class SeniorityLensImplementation implements SeniorityLens {
  constructor(private readonly context: LensContext, private readonly common: CommonSeniorityLens) {}

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
    return new AnchoredSeniorityLensImplementation(this.context, this.common, anchor)
  }
}

class AnchoredSeniorityLensImplementation implements AnchoredSeniorityLens {
  readonly seniorityStanding: AnchoredSeniorityLens['seniorityStanding']
  readonly seniorityTrajectory: AnchoredSeniorityLens['seniorityTrajectory']
  readonly seniorityTrajectoryComparison: AnchoredSeniorityLens['seniorityTrajectoryComparison']
  readonly percentileCrossing: AnchoredSeniorityLens['percentileCrossing']
  readonly qualificationPositions: AnchoredSeniorityLens['qualificationPositions']
  readonly holdabilityDetail: AnchoredSeniorityLens['holdabilityDetail']
  readonly relativeUpcomingRetirements: (filter: RelativeUpcomingRetirementFilter) => readonly RelativeUpcomingRetirement[]

  constructor(
    private readonly context: LensContext,
    private readonly common: CommonSeniorityLens,
    readonly anchor: Readonly<SeniorityEntry>,
  ) {
    const entries = context.snapshot.entries
    const seniorityNumber = anchor.seniority_number
    /** Dynamic Rank: Publication Position minus pilots senior to the given number who have already retired. */
    // One pass over the roster, then a binary search per lookup: the Retirements reports ask for the
    // Dynamic Rank of every retiring pilot, so a scan per lookup grows with retirees × roster.
    const bySeniority = entries.toSorted((a, b) => a.seniority_number - b.seniority_number)
    const date = context.asOfDate
    const retiredBefore = [0]
    for (const entry of bySeniority) {
      retiredBefore.push(retiredBefore.at(-1)! + (entry.retire_date && isRetiredBy(entry.retire_date, date) ? 1 : 0))
    }
    const dynamicRank = (number: number): number => {
      let low = 0
      let high = bySeniority.length
      while (low < high) {
        const mid = (low + high) >>> 1
        if (bySeniority[mid]!.seniority_number < number) low = mid + 1
        else high = mid
      }
      return low + 1 - retiredBefore[low]!
    }
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
      const today = context.asOfDate
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
        isModeled: normalizeEmployeeNumber(anchor.employee_number) === context.modeledEmployeeNumber,
      }
    }, options => `seniority-standing:${stableStringify(options?.scenario?.qualificationScope ?? {})}`)

    this.seniorityTrajectory = memoizeLast((options) => {
      const scenario = options.scenario ?? createSeniorityScenario()
      const unavailable = noResultFor(context.asOfDate)
      if (unavailable) return unavailable
      const trajectory = calculateSeniorityTrajectory({
        entries,
        seniorityNumber,
        from: context.asOfDate,
        through: options.through,
        predicate: scopePredicateIncludingAnchor(scenario.qualificationScope),
        growthAssumptions: scenario.growthAssumptions,
        anchorRetireDate: anchor.retire_date ?? undefined,
      })
      return { ...trajectory, endedBy: endedBy(options.through), isHypothetical: isHypothetical(scenario.qualificationScope) }
    })

    this.seniorityTrajectoryComparison = memoizeLast((options) => {
      const unavailable = noResultFor(context.asOfDate)
      if (unavailable) return unavailable
      const comparison = calculateSeniorityTrajectoryComparison({
        entries,
        seniorityNumber,
        from: context.asOfDate,
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
      const unavailable = noResultFor(context.asOfDate)
      if (unavailable) return unavailable
      return analyzeQualificationPositions(
        entries,
        seniorityNumber,
        context.asOfDate,
        options.through,
        options.growthAssumptions,
      )
    })

    this.holdabilityDetail = memoizeLast((options) => {
      const unavailable = noResultFor(context.asOfDate)
      if (unavailable) return unavailable
      return analyzeHoldabilityDetail(
        entries,
        seniorityNumber,
        context.asOfDate,
        options.qualification,
        options.growthAssumptions,
      )
    })

    this.relativeUpcomingRetirements = memoizeLast(filter => this.common.upcomingRetirements(filter)
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
  readonly retirementCountProjection = (options: RetirementCountProjectionOptions): AnchoredRetirementCountProjection => ({
    ...this.common.retirementCountProjection(options),
    seniorRetirementCount: this.relativeUpcomingRetirements({
      through: options.through,
      qualificationScope: options.scenario?.qualificationScope,
      seniorOnly: true,
    }).length,
  })
  readonly demographics = (options: DemographicsOptions): SeniorityDemographics => ({
    ...this.common.demographics(options),
    anchorYearsOfService: computeYOSDate(this.anchor.hire_date, this.context.asOfDate),
  })
  readonly upcomingRetirements = (filter: UpcomingRetirementFilter) => this.common.upcomingRetirements(filter)
}

export function createSeniorityLens(
  snapshot: SenioritySnapshot,
  options: CreateSeniorityLensOptions,
): SeniorityLens {
  const modeledEmployeeNumber = options.modeledEmployeeNumber
    ? normalizeEmployeeNumber(options.modeledEmployeeNumber)
    : null
  const context: LensContext = { snapshot, modeledEmployeeNumber, asOfDate: options.asOfDate }
  return new SeniorityLensImplementation(context, createCommonLens(context))
}
