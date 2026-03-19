import type {
  CellBreakdownRow,
  ComparativeTrajectoryResult,
  DemographicsResult,
  PilotAnchor,
  RetirementProjectionResult,
  Scenario,
  SeniorityLens,
  SenioritySnapshot,
  StandingResult,
  TrajectoryResult,
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
} from '#shared/utils/seniority-math'
import { createScenario } from './scenario'
import { qualSpecToFilter } from './qual-spec'
import type {
  PowerIndexCell,
  QualDemographicScale,
  RetirementWaveBucket,
  ThresholdResult,
} from '#shared/utils/qual-analytics'
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
} from '#shared/utils/qual-analytics'

export function createLens(
  snapshot: SenioritySnapshot,
  anchor?: PilotAnchor,
): SeniorityLens {
  const resolvedAnchor = anchor ?? null
  const entries = snapshot.entries

  // Cache the anchor's entry via O(1) employee number lookup
  const anchorEntry = resolvedAnchor
    ? snapshot.byEmployeeNumber.get(resolvedAnchor.employeeNumber) ?? null
    : null

  function standing(): StandingResult | null {
    if (!resolvedAnchor) return null
    const { seniorityNumber } = resolvedAnchor
    const today = new Date()
    const total = entries.length
    const currentYear = today.getFullYear()

    const rank = computeRank(entries, seniorityNumber)
    const retiredAbove = countRetiredAbove(entries, seniorityNumber, today)
    const adjustedRank = rank - retiredAbove

    // Retirements this year
    const retiringThisYear = entries.filter(e => {
      if (!e.retire_date) return false
      return new Date(e.retire_date).getFullYear() === currentYear
    })
    const retirementsThisYear = retiringThisYear.length
    const retirementsThisYearSeniorToAnchor = retiringThisYear.filter(
      e => e.seniority_number < seniorityNumber,
    ).length

    // Cell breakdown from pre-computed byCell map
    const cellBreakdown: CellBreakdownRow[] = []
    for (const cellEntries of snapshot.byCell.values()) {
      const first = cellEntries[0]!
      const cellTotal = cellEntries.length
      const cellRetired = cellEntries.filter(
        e => e.retire_date && new Date(e.retire_date) <= today,
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
        percentile: cellTotal > 0 ? Math.round((cellRank / cellTotal) * 100 * 10) / 10 : 0,
        adjustedPercentile: cellAdjustedTotal > 0
          ? Math.round((cellAdjustedRank / cellAdjustedTotal) * 100 * 10) / 10 : 0,
        isAnchorCurrent: !!(
          anchorEntry
          && anchorEntry.base === first.base
          && anchorEntry.seat === first.seat
          && anchorEntry.fleet === first.fleet
        ),
      })
    }

    return {
      rank,
      adjustedRank,
      total,
      retiredAbove,
      retirementsThisYear,
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
    // Note: only scopeFilter is compared between scenarios — growthConfig from scenarioA is used for both.
    // Callers should differ only in scopeFilter; differing growthConfigs are silently ignored.
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

    const scaleEntries = (mult: number) =>
      entries.map(e => {
        if (!e.retire_date) return e
        const retireMs = new Date(e.retire_date).getTime()
        // Skip already-retired pilots — scaling a past date inverts optimistic/pessimistic direction
        if (retireMs <= today.getTime()) return e
        const durationMs = (retireMs - today.getTime()) * mult
        return {
          ...e,
          retire_date: new Date(today.getTime() + durationMs).toISOString().split('T')[0]!,
        }
      })

    const optimistic = buildTrajectory(
      scaleEntries(0.9), resolvedAnchor.seniorityNumber, timePoints,
      filter, gc,
    )
    const pessimistic = buildTrajectory(
      scaleEntries(1.1), resolvedAnchor.seniorityNumber, timePoints,
      filter, gc,
    )

    return findThresholdYear(base, optimistic, pessimistic, targetPercentile)
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

  return {
    standing,
    trajectory,
    compareTrajectories,
    percentileCrossing,
    holdability,
    qualScales,
    retirementWave,
    retirementProjection,
    demographics,
    snapshot,
    anchor: resolvedAnchor,
  }
}
