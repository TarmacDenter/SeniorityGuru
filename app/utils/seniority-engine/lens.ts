import type {
  CellBreakdownRow,
  ComparativeTrajectoryResult,
  DemographicsResult,
  PilotAnchor,
  PowerIndexCell,
  QualDemographicScale,
  RetirementProjectionResult,
  RetirementWaveBucket,
  Scenario,
  SeniorityLens,
  SenioritySnapshot,
  StandingResult,
  ThresholdResult,
  TrajectoryResult,
  UpcomingRetirementFilter,
  UpcomingRetirementRow,
} from './types'
import {
  computeRank,
  countRetiredAbove,
  buildTrajectory,
  generateTimePoints,
  getProjectionEndDateValue,
  projectRetirements,
  projectComparativeTrajectory,
  computeTrajectoryDeltas,
} from '~/utils/seniority-math'
import { createScenario } from './scenario'
import { memoizeLast } from './memoize'
import { qualSpecToFilter } from './qual-spec'
import { computePercentile } from './percentile'
import {
  findThresholdYear,
  computePowerIndexCells,
  computeQualSnapshots,
  applyProjectionToSnapshots,
  computeRetirementWave,
  computeAgeDistribution,
  computeYosDistribution,
  computeYosHistogram,
  computeQualComposition,
  findMostJuniorCA,
} from '~/utils/qual-analytics'
import { addYearsDate, isRetiredBy, retiresWithinNextYear } from '~/utils/date'
import { Temporal } from '~/utils/temporal'

export function createLens(
  snapshot: SenioritySnapshot,
  anchor: PilotAnchor | undefined,
  asOfDate: Temporal.PlainDate,
): SeniorityLens {
  const resolvedAnchor: PilotAnchor | null = anchor ?? null
  // Resolve once so every calculation in this lens observes the same date.
  const referenceISO = asOfDate.toString()
  const referenceDate = () => Temporal.PlainDate.from(referenceISO)
  const entries = snapshot.entries

  const anchorEntry = resolvedAnchor
    ? snapshot.byEmployeeNumber.get(resolvedAnchor.employeeNumber) ?? null
    : null

  function retirementsThisYear(): number {
    return entries.filter(e => !!e.retire_date && retiresWithinNextYear(e.retire_date.toString(), referenceDate().toString())).length
  }

  function standing(): StandingResult | null {
    if (!resolvedAnchor) return null
    const { seniorityNumber } = resolvedAnchor
    const today = referenceDate()
    const total = entries.length

    const rank = computeRank(entries, seniorityNumber)
    const retiredAbove = countRetiredAbove(entries, seniorityNumber, today)
    const adjustedRank = rank - retiredAbove

    const retiringNextYear = entries.filter(e => !!e.retire_date && retiresWithinNextYear(e.retire_date.toString(), today.toString()))
    const retirementsThisYearCount = retirementsThisYear()
    const retirementsThisYearSeniorToAnchor = retiringNextYear.filter(
      e => e.seniority_number < seniorityNumber,
    ).length

    const cellBreakdown: CellBreakdownRow[] = []
    for (const cellEntries of snapshot.byCell.values()) {
      const first = cellEntries[0]!
      const cellTotal = cellEntries.length
      const cellRetired = cellEntries.filter(
        e => e.retire_date && isRetiredBy(e.retire_date, today),
      ).length
      const cellAdjustedTotal = cellTotal - cellRetired
      const cellRank = computeRank(cellEntries, seniorityNumber)
      const cellRetiredAbove = countRetiredAbove(cellEntries, seniorityNumber, today)
      const cellAdjustedRank = cellRank - cellRetiredAbove

      cellBreakdown.push({
        base: first.base,
        seat: first.seat,
        fleet: first.fleet,
        rank: cellRank,
        adjustedRank: cellAdjustedRank,
        total: cellTotal,
        adjustedTotal: cellAdjustedTotal,
        percentile: computePercentile(cellRank, cellTotal),
        adjustedPercentile: computePercentile(cellAdjustedRank, cellAdjustedTotal),
        isAnchorCurrent: !!(
          anchorEntry
          && anchorEntry.base === first.base
          && anchorEntry.seat === first.seat
          && anchorEntry.fleet === first.fleet
        ),
      })
    }

    const adjustedTotal = cellBreakdown.reduce((sum, cell) => sum + cell.adjustedTotal, 0)

    return {
      rank,
      adjustedRank,
      total,
      adjustedTotal,
      percentile: computePercentile(rank, total),
      adjustedPercentile: computePercentile(adjustedRank, adjustedTotal),
      retiredAbove,
      retirementsThisYear: retirementsThisYearCount,
      retirementsThisYearSeniorToAnchor,
      cellBreakdown,
    }
  }

  function trajectory(scenario?: Scenario): TrajectoryResult | null {
    if (!resolvedAnchor) return null
    const s = scenario ?? createScenario({ projectionDate: referenceDate() })
    const { today, endDate } = getProjectionEndDateValue(resolvedAnchor.retireDate, referenceDate())
    const timePoints = generateTimePoints(today, endDate)
    const points = buildTrajectory(
      entries, resolvedAnchor.seniorityNumber, timePoints,
      qualSpecToFilter(s.scopeFilter), s.growthConfig,
    )
    return {
      points,
      chartData: {
        labels: points.map(p => p.date.toString()),
        data: points.map(p => p.percentile),
      },
      deltas: computeTrajectoryDeltas(points),
    }
  }

  function compareTrajectories(
    scenarioA: Scenario, scenarioB: Scenario,
  ): ComparativeTrajectoryResult | null {
    if (!resolvedAnchor) return null
    return projectComparativeTrajectory(
      entries,
      resolvedAnchor.seniorityNumber,
      resolvedAnchor.retireDate,
      referenceDate(),
      qualSpecToFilter(scenarioA.scopeFilter),
      qualSpecToFilter(scenarioB.scopeFilter),
      scenarioA.growthConfig,
    )
  }

  function percentileCrossing(
    targetPercentile: number, scenario?: Scenario,
  ): ThresholdResult | null {
    if (!resolvedAnchor) return null
    const s = scenario ?? createScenario({ projectionDate: referenceDate() })
    const { today, endDate } = getProjectionEndDateValue(resolvedAnchor.retireDate, referenceDate())
    const timePoints = generateTimePoints(today, endDate)
    const gc = s.growthConfig

    const filter = qualSpecToFilter(s.scopeFilter)

    const base = buildTrajectory(
      entries, resolvedAnchor.seniorityNumber, timePoints,
      filter, gc,
    )

    return findThresholdYear(base, targetPercentile)
  }

  function holdability(scenario?: Scenario): PowerIndexCell[] {
    if (!resolvedAnchor) return []
    const s = scenario ?? createScenario({ projectionDate: referenceDate() })
    return computePowerIndexCells(
      entries,
      resolvedAnchor.seniorityNumber,
      s.projectionDate,
      s.growthConfig,
      referenceDate(),
    )
  }

  function qualScales(scenario?: Scenario): QualDemographicScale[] {
    if (!resolvedAnchor) return []
    const s = scenario ?? createScenario({ projectionDate: referenceDate() })
    const snapshots = computeQualSnapshots(entries, referenceDate())
    if (snapshots.length === 0) return []
    return applyProjectionToSnapshots(
      snapshots, entries, resolvedAnchor.seniorityNumber,
      s.projectionDate, s.growthConfig,
      referenceDate(),
    )
  }

  function retirementWave(scenario?: Scenario): RetirementWaveBucket[] {
    const s = scenario ?? createScenario({ projectionDate: referenceDate() })
    return computeRetirementWave(entries, qualSpecToFilter(s.scopeFilter))
  }

  function retirementProjection(scenario?: Scenario): RetirementProjectionResult {
    const s = scenario ?? createScenario({ projectionDate: referenceDate() })
    return projectRetirements(
      entries,
      resolvedAnchor?.retireDate ?? null,
      referenceDate(),
      qualSpecToFilter(s.scopeFilter),
    )
  }

  function demographics(mandatoryAge: number, scenario?: Scenario): DemographicsResult {
    const s = scenario ?? createScenario({ projectionDate: referenceDate() })
    const filter = qualSpecToFilter(s.scopeFilter)
    const filtered = entries.filter(filter)

    return {
      ageDistribution: computeAgeDistribution(entries, mandatoryAge, filter, referenceDate()),
      yosDistribution: computeYosDistribution(entries, filter, referenceDate()),
      yosHistogram: computeYosHistogram(entries, filter, referenceDate()),
      qualComposition: computeQualComposition(filtered),
      mostJuniorCAs: findMostJuniorCA(filtered, referenceDate()),
    }
  }

  function upcomingRetirements(filter: UpcomingRetirementFilter): UpcomingRetirementRow[] {
    const today = referenceDate()
    const cutoff = addYearsDate(today, filter.yearsHorizon)

    return entries
      .filter((e) => {
        if (!e.retire_date) return false
        if (isRetiredBy(e.retire_date, today)) return false
        if (!isRetiredBy(e.retire_date, cutoff)) return false
        if (filter.seniorOnly && resolvedAnchor && e.seniority_number >= resolvedAnchor.seniorityNumber) return false
        if (filter.base && e.base !== filter.base) return false
        if (filter.seat && e.seat !== filter.seat) return false
        if (filter.fleet && e.fleet !== filter.fleet) return false
        return true
      })
      .sort((a, b) => Temporal.PlainDate.compare(a.retire_date!, b.retire_date!))
      .map((e): UpcomingRetirementRow => ({
        seniorityNumber: e.seniority_number,
        employeeNumber: e.employee_number,
        base: e.base,
        seat: e.seat,
        fleet: e.fleet,
        retireDate: e.retire_date!,
        rankRelativeToMe: resolvedAnchor
          ? resolvedAnchor.seniorityNumber - e.seniority_number
          : null,
      }))
  }

  return {
    retirementsThisYear,
    standing: memoizeLast(standing, () => 'standing'),
    trajectory: memoizeLast(trajectory),
    compareTrajectories: memoizeLast(compareTrajectories),
    percentileCrossing: memoizeLast(percentileCrossing),
    holdability: memoizeLast(holdability),
    qualScales: memoizeLast(qualScales),
    retirementWave: memoizeLast(retirementWave),
    retirementProjection: memoizeLast(retirementProjection),
    demographics: memoizeLast(demographics),
    upcomingRetirements,
    snapshot,
    anchor: resolvedAnchor,
  }
}
