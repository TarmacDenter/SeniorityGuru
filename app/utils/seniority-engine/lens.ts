import type {
  AnchoredSeniorityLens,
  CellBreakdownRow,
  ComparativeTrajectoryResult,
  DemographicsResult,
  QualDemographicScale,
  RetirementProjectionOptions,
  RetirementProjectionResult,
  RetirementWaveBucket,
  Scenario,
  SeniorityLens,
  SenioritySnapshot,
  StandingResult,
  ThresholdResult,
  TrajectoryResult,
  UpcomingRetirementFilter,
  UpcomingRetirementRelativeFilter,
  UpcomingRetirementRelativeRow,
  UpcomingRetirementRow,
} from './types'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import {
  buildTrajectory,
  computeRank,
  computeTrajectoryDeltas,
  countRetiredAbove,
  generateTimePoints,
  getProjectionEndDateValue,
  projectComparativeTrajectory,
  projectRetirements,
} from '~/utils/seniority-math'
import { createScenario } from './scenario'
import { memoizeLast } from './memoize'
import { qualSpecToFilter } from './qual-spec'
import { computePercentile } from './percentile'
import { computeAgeDistribution, computeQualComposition, computeYosDistribution, computeYosHistogram, findMostJuniorCA } from './demographics'
import { computeRetirementWave } from './retirement-analysis'
import { applyProjectionToSnapshots, computeQualSnapshots } from './qualification-position'
import { findThresholdYear } from './trajectory-analysis'
import { addYearsDate, isRetiredBy, retiresWithinNextYear } from '~/utils/date'
import { Temporal } from '~/utils/temporal'

/** Options that make every calculation in a lens deterministic. */
export interface CreateLensOptions {
  /** Date used for retirement, age, and projection calculations. */
  asOfDate: Temporal.PlainDate
}

/** Thrown when `withAnchor()` cannot find an employee in the lens snapshot. */
export class AnchorNotFoundError extends Error {
  constructor(readonly employeeNumber: string) {
    super(`No seniority entry exists for employee number "${employeeNumber}".`)
    this.name = 'AnchorNotFoundError'
  }
}

/**
 * Shared immutable analysis state for one snapshot and reference date.
 *
 * The organization lens creates this context once. Every anchored lens derived
 * from it reuses the same snapshot and organization-level memoized methods.
 * Each anchored lens keeps its pilot-relative memoization outside this context.
 */
interface LensContext {
  readonly snapshot: SenioritySnapshot
  readonly referenceISO: string
  readonly retirementsThisYear: () => number
  readonly retirementWave: (scenario?: Scenario) => RetirementWaveBucket[]
  readonly retirementProjection: (options?: RetirementProjectionOptions) => RetirementProjectionResult
  readonly demographics: (mandatoryAge: number, scenario?: Scenario) => DemographicsResult
  readonly upcomingRetirements: (filter: UpcomingRetirementFilter) => UpcomingRetirementRow[]
}

function referenceDate(referenceISO: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(referenceISO)
}

/** Creates the shared organization analysis state for one lens family. */
function createContext(snapshot: SenioritySnapshot, asOfDate: Temporal.PlainDate): LensContext {
  const referenceISO = asOfDate.toString()
  const entries = snapshot.entries
  const retirementsThisYear = () => entries.filter(entry =>
    !!entry.retire_date && retiresWithinNextYear(entry.retire_date.toString(), referenceDate(referenceISO).toString()),
  ).length
  const retirementWave = (scenario?: Scenario) => {
    const scenarioValue = scenario ?? createScenario({ projectionDate: referenceDate(referenceISO) })
    return computeRetirementWave(entries, qualSpecToFilter(scenarioValue.scopeFilter))
  }
  const retirementProjection = (options?: RetirementProjectionOptions) => {
    const scenarioValue = options?.scenario ?? createScenario({ projectionDate: referenceDate(referenceISO) })
    return projectRetirements(entries, options?.through ?? null, referenceDate(referenceISO), qualSpecToFilter(scenarioValue.scopeFilter))
  }
  const demographics = (mandatoryAge: number, scenario?: Scenario) => {
    const scenarioValue = scenario ?? createScenario({ projectionDate: referenceDate(referenceISO) })
    const filter = qualSpecToFilter(scenarioValue.scopeFilter)
    const filtered = entries.filter(filter)
    return {
      ageDistribution: computeAgeDistribution(entries, mandatoryAge, filter, referenceDate(referenceISO)),
      yosDistribution: computeYosDistribution(entries, filter, referenceDate(referenceISO)),
      yosHistogram: computeYosHistogram(entries, filter, referenceDate(referenceISO)),
      qualComposition: computeQualComposition(filtered),
      mostJuniorCAs: findMostJuniorCA(filtered, referenceDate(referenceISO)),
    }
  }
  const upcomingRetirements = (filter: UpcomingRetirementFilter) => {
    const today = referenceDate(referenceISO)
    const cutoff = addYearsDate(today, filter.yearsHorizon)
    return entries
      .filter((entry) => {
        if (!entry.retire_date) return false
        if (isRetiredBy(entry.retire_date, today)) return false
        if (!isRetiredBy(entry.retire_date, cutoff)) return false
        if (filter.base && entry.base !== filter.base) return false
        if (filter.seat && entry.seat !== filter.seat) return false
        if (filter.fleet && entry.fleet !== filter.fleet) return false
        return true
      })
      .sort((a, b) => Temporal.PlainDate.compare(a.retire_date!, b.retire_date!))
      .map((entry): UpcomingRetirementRow => ({
        seniorityNumber: entry.seniority_number,
        employeeNumber: entry.employee_number,
        base: entry.base,
        seat: entry.seat,
        fleet: entry.fleet,
        retireDate: entry.retire_date!,
      }))
  }

  return {
    snapshot,
    referenceISO,
    retirementsThisYear: memoizeLast(retirementsThisYear, () => 'retirements-this-year'),
    retirementWave: memoizeLast(retirementWave),
    retirementProjection: memoizeLast(retirementProjection),
    demographics: memoizeLast(demographics),
    upcomingRetirements: memoizeLast(upcomingRetirements),
  }
}

/**
 * Immutable organization lens over one snapshot and reference date.
 * It has no pilot-relative methods. Deriving an anchor shares its snapshot and
 * organization memoization without rebuilding or copying either.
 */
class SeniorityLensImpl implements SeniorityLens {
  constructor(private readonly context: LensContext) {}

  get snapshot(): SenioritySnapshot {
    return this.context.snapshot
  }

  retirementsThisYear(): number {
    return this.context.retirementsThisYear()
  }

  retirementWave(scenario?: Scenario): RetirementWaveBucket[] {
    return this.context.retirementWave(scenario)
  }

  retirementProjection(options?: RetirementProjectionOptions): RetirementProjectionResult {
    return this.context.retirementProjection(options)
  }

  demographics(mandatoryAge: number, scenario?: Scenario): DemographicsResult {
    return this.context.demographics(mandatoryAge, scenario)
  }

  upcomingRetirements(filter: UpcomingRetirementFilter): UpcomingRetirementRow[] {
    return this.context.upcomingRetirements(filter)
  }

  withAnchor(employeeNumber: string): AnchoredSeniorityLens {
    const anchor = this.context.snapshot.byEmployeeNumber.get(employeeNumber)
    if (!anchor) throw new AnchorNotFoundError(employeeNumber)
    return new AnchoredSeniorityLensImpl(this.context, anchor)
  }
}

/**
 * Immutable pilot-relative lens derived from an organization lens.
 * `anchor` is the canonical readonly entry in the shared snapshot. Each
 * derived lens owns relative memoization while common analysis stays shared.
 */
class AnchoredSeniorityLensImpl implements AnchoredSeniorityLens {
  readonly standing: () => StandingResult
  readonly trajectory: (scenario?: Scenario) => TrajectoryResult
  readonly compareTrajectories: (scenarioA: Scenario, scenarioB: Scenario) => ComparativeTrajectoryResult
  readonly percentileCrossing: (targetPercentile: number, scenario?: Scenario) => ThresholdResult | null
  readonly qualScales: (scenario?: Scenario) => QualDemographicScale[]
  readonly upcomingRetirementsRelativeToAnchor: (filter: UpcomingRetirementRelativeFilter) => UpcomingRetirementRelativeRow[]

  constructor(private readonly context: LensContext, readonly anchor: Readonly<SeniorityEntry>) {
    const entries = context.snapshot.entries
    const currentDate = () => referenceDate(context.referenceISO)
    const seniorityNumber = anchor.seniority_number

    this.standing = memoizeLast(() => {
      const today = currentDate()
      const rank = computeRank(entries, seniorityNumber)
      const retiredAbove = countRetiredAbove(entries, seniorityNumber, today)
      const cellBreakdown: CellBreakdownRow[] = []
      for (const cellEntries of context.snapshot.byCell.values()) {
        const first = cellEntries[0]!
        const cellTotal = cellEntries.length
        const cellRetired = cellEntries.filter(entry => entry.retire_date && isRetiredBy(entry.retire_date, today)).length
        const cellAdjustedTotal = cellTotal - cellRetired
        const cellRank = computeRank(cellEntries, seniorityNumber)
        const cellRetiredAbove = countRetiredAbove(cellEntries, seniorityNumber, today)
        const cellAdjustedRank = cellRank - cellRetiredAbove
        cellBreakdown.push({
          base: first.base, seat: first.seat, fleet: first.fleet,
          rank: cellRank, adjustedRank: cellAdjustedRank, total: cellTotal, adjustedTotal: cellAdjustedTotal,
          percentile: computePercentile(cellRank, cellTotal),
          adjustedPercentile: computePercentile(cellAdjustedRank, cellAdjustedTotal),
          isAnchorCurrent: anchor.base === first.base && anchor.seat === first.seat && anchor.fleet === first.fleet,
        })
      }
      const retiringNextYear = entries.filter(entry =>
        !!entry.retire_date && retiresWithinNextYear(entry.retire_date.toString(), today.toString()),
      )
      const adjustedTotal = cellBreakdown.reduce((sum, cell) => sum + cell.adjustedTotal, 0)
      return {
        rank, adjustedRank: rank - retiredAbove, total: entries.length, adjustedTotal,
        percentile: computePercentile(rank, entries.length),
        adjustedPercentile: computePercentile(rank - retiredAbove, adjustedTotal),
        retiredAbove,
        retirementsThisYear: this.context.retirementsThisYear(),
        retirementsThisYearSeniorToAnchor: retiringNextYear.filter(entry => entry.seniority_number < seniorityNumber).length,
        cellBreakdown,
      }
    }, () => 'standing')

    this.trajectory = memoizeLast((scenario?: Scenario) => {
      const scenarioValue = scenario ?? createScenario({ projectionDate: currentDate() })
      const { today, endDate } = getProjectionEndDateValue(anchor.retire_date ?? null, currentDate())
      const points = buildTrajectory(entries, seniorityNumber, generateTimePoints(today, endDate), qualSpecToFilter(scenarioValue.scopeFilter), scenarioValue.growthConfig)
      return { points, chartData: { labels: points.map(point => point.date.toString()), data: points.map(point => point.percentile) }, deltas: computeTrajectoryDeltas(points) }
    })

    this.compareTrajectories = memoizeLast((scenarioA: Scenario, scenarioB: Scenario) => projectComparativeTrajectory(
      entries, seniorityNumber, anchor.retire_date ?? null, currentDate(),
      qualSpecToFilter(scenarioA.scopeFilter), qualSpecToFilter(scenarioB.scopeFilter), scenarioA.growthConfig,
    ))

    this.percentileCrossing = memoizeLast((targetPercentile: number, scenario?: Scenario) => {
      const scenarioValue = scenario ?? createScenario({ projectionDate: currentDate() })
      const { today, endDate } = getProjectionEndDateValue(anchor.retire_date ?? null, currentDate())
      const points = buildTrajectory(entries, seniorityNumber, generateTimePoints(today, endDate), qualSpecToFilter(scenarioValue.scopeFilter), scenarioValue.growthConfig)
      return findThresholdYear(points, targetPercentile)
    })

    this.qualScales = memoizeLast((scenario?: Scenario) => {
      const scenarioValue = scenario ?? createScenario({ projectionDate: currentDate() })
      const snapshots = computeQualSnapshots(entries, currentDate())
      return snapshots.length === 0 ? [] : applyProjectionToSnapshots(snapshots, entries, seniorityNumber, scenarioValue.projectionDate, scenarioValue.growthConfig, currentDate())
    })

    this.upcomingRetirementsRelativeToAnchor = memoizeLast((filter: UpcomingRetirementRelativeFilter) => this.context.upcomingRetirements(filter)
      .filter(row => !filter.seniorOnly || row.seniorityNumber < seniorityNumber)
      .map((row): UpcomingRetirementRelativeRow => ({ ...row, rankRelativeToAnchor: seniorityNumber - row.seniorityNumber })))
  }

  get snapshot(): SenioritySnapshot {
    return this.context.snapshot
  }

  retirementsThisYear(): number {
    return this.context.retirementsThisYear()
  }

  retirementWave(scenario?: Scenario): RetirementWaveBucket[] {
    return this.context.retirementWave(scenario)
  }

  retirementProjection(options?: RetirementProjectionOptions): RetirementProjectionResult {
    return this.context.retirementProjection(options)
  }

  demographics(mandatoryAge: number, scenario?: Scenario): DemographicsResult {
    return this.context.demographics(mandatoryAge, scenario)
  }

  upcomingRetirements(filter: UpcomingRetirementFilter): UpcomingRetirementRow[] {
    return this.context.upcomingRetirements(filter)
  }
}

/**
 * Creates an unanchored immutable organization lens.
 *
 * Call `withAnchor(employeeNumber)` for pilot-relative analysis. The derived
 * lens shares this exact snapshot and its organization-level memoization.
 */
export function createLens(snapshot: SenioritySnapshot, options: CreateLensOptions): SeniorityLens {
  return new SeniorityLensImpl(createContext(snapshot, options.asOfDate))
}
