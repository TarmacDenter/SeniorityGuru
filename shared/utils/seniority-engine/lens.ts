import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'
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
} from '#shared/utils/seniority-math'
import type {
  PowerIndexCell,
  QualDemographicScale,
  RetirementWaveBucket,
  ThresholdResult,
} from '#shared/utils/qual-analytics'

export function createLens(
  snapshot: SenioritySnapshot,
  anchor?: PilotAnchor,
): SeniorityLens {
  const resolvedAnchor = anchor ?? null
  const entries = snapshot.entries as SeniorityEntryResponse[]

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
        base: first.base!,
        seat: first.seat!,
        fleet: first.fleet!,
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

  function trajectory(_scenario?: Scenario): TrajectoryResult | null {
    throw new Error('Not implemented yet')
  }

  function compareTrajectories(
    _scenarioA: Scenario, _scenarioB: Scenario,
  ): ComparativeTrajectoryResult | null {
    throw new Error('Not implemented yet')
  }

  function percentileCrossing(
    _target: number, _scenario?: Scenario,
  ): ThresholdResult | null {
    throw new Error('Not implemented yet')
  }

  function holdability(_scenario?: Scenario): PowerIndexCell[] {
    throw new Error('Not implemented yet')
  }

  function qualScales(_scenario?: Scenario): QualDemographicScale[] {
    throw new Error('Not implemented yet')
  }

  function retirementWave(_scenario?: Scenario): RetirementWaveBucket[] {
    throw new Error('Not implemented yet')
  }

  function retirementProjection(_scenario?: Scenario): RetirementProjectionResult {
    throw new Error('Not implemented yet')
  }

  function demographics(_mandatoryAge: number, _scenario?: Scenario): DemographicsResult {
    throw new Error('Not implemented yet')
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
