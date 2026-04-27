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
  getProjectionEndDate,
  projectRetirements,
  projectComparativeTrajectory,
  computeTrajectoryDeltas,
} from '~/utils/seniority-math'
import { createScenario } from './scenario'
import { memoizeLast } from './memoize'
import { qualSpecToFilter } from './qual-spec'
import { computePercentile } from './percentile'
import {
  pipe as rPipe,
  filter as rFilter,
  sortBy as rSortBy,
  map as rMap,
  allPass as rAllPass,
  anyPass as rAnyPass,
} from 'remeda'
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
import { todayISO, isRetiredBy, retiresWithinNextYear, addYearsISO } from '~/utils/date'

export function createLens(
  snapshot: SenioritySnapshot,
  anchor?: PilotAnchor,
): SeniorityLens {
  const resolvedAnchor = anchor ?? null
  const entries = snapshot.entries

  const anchorEntry = resolvedAnchor
    ? snapshot.byEmployeeNumber.get(resolvedAnchor.employeeNumber) ?? null
    : null

  function retirementsThisYear(): number {
    const today = todayISO()
    return entries.filter(e => !!e.retire_date && retiresWithinNextYear(e.retire_date, today)).length
  }

  function standing(): StandingResult | null {
    if (!resolvedAnchor) return null
    const { seniorityNumber } = resolvedAnchor
    const todayStr = todayISO()
    const total = entries.length

    const rank = computeRank(entries, seniorityNumber)
    const retiredAbove = countRetiredAbove(entries, seniorityNumber, todayStr)
    const adjustedRank = rank - retiredAbove

    const retiringNextYear = entries.filter(e => !!e.retire_date && retiresWithinNextYear(e.retire_date, todayStr))
    const retirementsThisYearCount = retirementsThisYear()
    const retirementsThisYearSeniorToAnchor = retiringNextYear.filter(
      e => e.seniority_number < seniorityNumber,
    ).length

    const cellBreakdown: CellBreakdownRow[] = []
    for (const cellEntries of snapshot.byCell.values()) {
      const first = cellEntries[0]!
      const cellTotal = cellEntries.length
      const cellRetired = cellEntries.filter(
        e => e.retire_date && isRetiredBy(e.retire_date, todayStr),
      ).length
      const cellAdjustedTotal = cellTotal - cellRetired
      const cellRank = computeRank(cellEntries, seniorityNumber)
      const cellRetiredAbove = countRetiredAbove(cellEntries, seniorityNumber, todayStr)
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
    const s = scenario ?? createScenario()
    const { today, endDate } = getProjectionEndDate(resolvedAnchor.retireDate)
    const timePoints = generateTimePoints(today, endDate)
    const points = buildTrajectory(
      entries, resolvedAnchor.seniorityNumber, timePoints,
      qualSpecToFilter(s.scopeFilter), s.growthConfig,
    )
    return {
      points,
      chartData: {
        labels: points.map(p => p.date),
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
      qualSpecToFilter(scenarioA.scopeFilter),
      qualSpecToFilter(scenarioB.scopeFilter),
      scenarioA.growthConfig,
    )
  }

  function percentileCrossing(
    targetPercentile: number, scenario?: Scenario,
  ): ThresholdResult | null {
    if (!resolvedAnchor) return null
    const s = scenario ?? createScenario()
    const { today, endDate } = getProjectionEndDate(resolvedAnchor.retireDate)
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
    const s = scenario ?? createScenario()
    return computePowerIndexCells(
      entries,
      resolvedAnchor.seniorityNumber,
      s.projectionDate,
      s.growthConfig,
    )
  }

  function qualScales(scenario?: Scenario): QualDemographicScale[] {
    if (!resolvedAnchor) return []
    const s = scenario ?? createScenario()
    const snapshots = computeQualSnapshots(entries)
    if (snapshots.length === 0) return []
    return applyProjectionToSnapshots(
      snapshots, entries, resolvedAnchor.seniorityNumber,
      s.projectionDate, s.growthConfig,
    )
  }

  function retirementWave(scenario?: Scenario): RetirementWaveBucket[] {
    const s = scenario ?? createScenario()
    return computeRetirementWave(entries, qualSpecToFilter(s.scopeFilter))
  }

  function retirementProjection(scenario?: Scenario): RetirementProjectionResult {
    const s = scenario ?? createScenario()
    return projectRetirements(
      entries,
      resolvedAnchor?.retireDate ?? null,
      qualSpecToFilter(s.scopeFilter),
    )
  }

  function demographics(mandatoryAge: number, scenario?: Scenario): DemographicsResult {
    const s = scenario ?? createScenario()
    const filter = qualSpecToFilter(s.scopeFilter)
    const filtered = entries.filter(filter)

    return {
      ageDistribution: computeAgeDistribution(entries, mandatoryAge, filter),
      yosDistribution: computeYosDistribution(entries, filter),
      yosHistogram: computeYosHistogram(entries, filter),
      qualComposition: computeQualComposition(filtered),
      mostJuniorCAs: findMostJuniorCA(filtered),
    }
  }

  function upcomingRetirements(filter: UpcomingRetirementFilter): UpcomingRetirementRow[] {
    const todayStr = todayISO()
    const cutoff = addYearsISO(todayStr, filter.yearsHorizon)
    const isSeniorToAnchor = (entry: typeof entries[number]) => (
      !filter.seniorOnly
      || !resolvedAnchor
      || entry.seniority_number < resolvedAnchor.seniorityNumber
    )
    const inQualScope = rAllPass([
      (entry: typeof entries[number]) => !filter.base || entry.base === filter.base,
      (entry: typeof entries[number]) => !filter.seat || entry.seat === filter.seat,
      (entry: typeof entries[number]) => !filter.fleet || entry.fleet === filter.fleet,
    ])
    const hasAnyQualFilter = rAnyPass([
      () => !!filter.base,
      () => !!filter.seat,
      () => !!filter.fleet,
    ])
    const retireWithinHorizon = (entry: typeof entries[number]) => (
      !!entry.retire_date
      && !isRetiredBy(entry.retire_date, todayStr)
      && isRetiredBy(entry.retire_date, cutoff)
    )

    return rPipe(
      entries,
      rFilter(rAllPass([
        retireWithinHorizon,
        isSeniorToAnchor,
        (entry) => !hasAnyQualFilter(entry) || inQualScope(entry),
      ])),
      rSortBy((entry) => entry.retire_date!),
      rMap((e): UpcomingRetirementRow => ({
        seniorityNumber: e.seniority_number,
        employeeNumber: e.employee_number,
        base: e.base,
        seat: e.seat,
        fleet: e.fleet,
        retireDate: e.retire_date!,
        rankRelativeToMe: resolvedAnchor
          ? resolvedAnchor.seniorityNumber - e.seniority_number
          : null,
      })),
    )
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
