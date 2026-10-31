import type { ComputedRef } from 'vue'
import { isNoResult } from '~/utils/seniority'
import { useSeniorityStore } from '~/stores/seniority'
import { useSeniorityCore } from './useSeniorityCore'

export interface RankCardData {
  seniorityNumber: number
  rank: number
  publicationPosition: number
  rosterSize: number
  publicationRosterSize: number
  activePilotCount: number
  isSimulated: boolean
  seniorityPercentile: number
  base: string
  seat: string
  fleet: string
  hireDate: string
  /** Why no Rank is available, e.g. "Anchor Pilot retired"; null when a Rank exists. */
  noResultLabel: string | null
}

export interface BaseStatusRow {
  base: string
  seat: string
  fleet: string
  rank: number
  publicationPosition: number
  rosterSize: number
  activePilotCount: number
  seniorityPercentile: number
  isAnchorCurrentQualification: boolean
}

export interface StatCard {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
}

export interface RetirementSnapshotData {
  atRetirement: { date: string; rank: number; percentile: number; rankDelta: string }
  fullTrajectory: { date: string; rank: number; percentile: number; rankDelta: string }[]
  retireDate: string
}

export function useStanding(): {
  rankCard: ComputedRef<RankCardData>
  baseStatus: ComputedRef<BaseStatusRow[]>
  statCards: ComputedRef<StatCard[]>
  retirementSnapshot: ComputedRef<RetirementSnapshotData | null>
} {
  const { analysis, anchoredAnalysis, newHire, projectionEndDate } = useSeniorityCore()
  const seniorityStore = useSeniorityStore()

  const anchorEntry = computed(() => anchoredAnalysis.value?.anchor)
  const rawStandingOutput = computed(() => anchoredAnalysis.value?.seniorityStanding() ?? null)
  const standingNoResult = computed(() => {
    const domain = rawStandingOutput.value?.domain
    return domain && isNoResult(domain) ? domain : null
  })
  const standingOutput = computed(() => {
    const output = rawStandingOutput.value
    if (!output || isNoResult(output.domain) || isNoResult(output.presentation)) return null
    return { domain: output.domain, presentation: output.presentation }
  })
  const standingResult = computed(() => standingOutput.value?.domain ?? null)

  const rankCard = computed<RankCardData>(() => {
    const entry = anchorEntry.value
    const standing = standingResult.value
    if (entry && !standing && standingNoResult.value) {
      return {
        seniorityNumber: entry.seniority_number,
        rank: 0,
        publicationPosition: 0,
        rosterSize: 0,
        publicationRosterSize: 0,
        activePilotCount: 0,
        isSimulated: false,
        seniorityPercentile: 0,
        base: entry.base ?? '--',
        seat: entry.seat ?? '--',
        fleet: entry.fleet ?? '--',
        hireDate: entry.hire_date.toString(),
        noResultLabel: standingNoResult.value.label,
      }
    }
    if (!entry || !standing) {
      return {
        seniorityNumber: 0,
        rank: 0,
        publicationPosition: 0,
        rosterSize: 0,
        publicationRosterSize: 0,
        activePilotCount: 0,
        isSimulated: false,
        seniorityPercentile: 0,
        base: '--',
        seat: '--',
        fleet: '--',
        hireDate: '--',
        noResultLabel: null,
      }
    }
    return {
      seniorityNumber: entry.seniority_number,
      rank: standing.rank,
      publicationPosition: standing.publicationPosition,
      rosterSize: standing.rosterSize,
      publicationRosterSize: seniorityStore.entries.length,
      activePilotCount: standing.activePilotCount,
      isSimulated: newHire.syntheticEntry.value?.employee_number === entry.employee_number,
      seniorityPercentile: standing.seniorityPercentile,
      base: entry.base ?? '--',
      seat: entry.seat ?? '--',
      fleet: entry.fleet ?? '--',
      hireDate: entry.hire_date.toString(),
      noResultLabel: null,
    }
  })

  const baseStatus = computed<BaseStatusRow[]>(() => {
    const standing = standingResult.value
    if (!standing) return []
    return standing.qualificationStandings.map(row => ({
      base: row.qualification.base,
      seat: row.qualification.seat,
      fleet: row.qualification.fleet,
      rank: row.rank,
      publicationPosition: row.publicationPosition,
      rosterSize: row.rosterSize,
      activePilotCount: row.activePilotCount,
      seniorityPercentile: row.seniorityPercentile,
      isAnchorCurrentQualification: row.isAnchorCurrentQualification,
    }))
  })

  const statCards = computed<StatCard[]>(() => {
    const lists = seniorityStore.lists
    const entry = anchorEntry.value
    const standing = standingResult.value

    let baseRankValue = '--'
    let baseRankLabel = 'Your Base Rank'
    if (standing && entry?.base && entry?.seat && entry?.fleet) {
      const userQualification = standingOutput.value?.presentation.qualificationStandings.find(
        item => item.qualification.base === entry.base
          && item.qualification.seat === entry.seat
          && item.qualification.fleet === entry.fleet,
      )
      if (userQualification) {
        baseRankValue = userQualification.rank.toLocaleString()
        baseRankLabel = userQualification.qualificationLabel
      }
    }

    return [
      {
        ...(rankCard.value.isSimulated
          ? {
              label: 'Total Pilots (modeled)',
              trend: `${rankCard.value.publicationRosterSize.toLocaleString()} in publication`,
            }
          : { label: 'Total Pilots' }),
        value: rankCard.value.rosterSize.toLocaleString(),
        icon: 'i-lucide-users',
      },
      {
        label: 'Retirements (Next 12 mo.)',
        value: standingOutput.value?.presentation.rollingNext12MonthRetirementsLabel
          ?? (analysis.value?.retirementsNext12Months() ?? 0).toLocaleString(),
        trend: entry && standing
          ? `${standing.rollingNext12MonthRetirementsSeniorToAnchor.toLocaleString()} senior to you`
          : undefined,
        trendUp: (standing?.rollingNext12MonthRetirementsSeniorToAnchor ?? 0) > 0 || undefined,
        icon: 'i-lucide-calendar-clock',
      },
      {
        label: baseRankLabel,
        value: baseRankValue,
        icon: 'i-lucide-map-pin',
      },
      {
        label: 'Lists Uploaded',
        value: lists.length.toLocaleString(),
        icon: 'i-lucide-file-text',
      },
    ]
  })

  const trajectoryResult = computed(() => projectionEndDate.value
    ? anchoredAnalysis.value?.seniorityTrajectory({ through: projectionEndDate.value }).domain ?? null
    : null)
  const trajectoryPoints = computed(() => {
    const trajectory = trajectoryResult.value
    return trajectory && !isNoResult(trajectory) ? trajectory.points : null
  })

  const retirementSnapshot = computed<RetirementSnapshotData | null>(() => {
    const entry = anchorEntry.value
    const trajectoryPointList = trajectoryPoints.value
    if (!entry?.retire_date || !trajectoryPointList || trajectoryPointList.length === 0) return null
    const fullTrajectory = trajectoryPointList.map((point, index, points) => {
      const previous = points[index - 1]
      const delta = previous ? point.rank - previous.rank : 0
      return {
        ...point,
        date: point.date.toString(),
        rankDelta: delta === 0 ? '--' : delta > 0 ? `+${delta}` : String(delta),
      }
    })
    return {
      atRetirement: fullTrajectory[fullTrajectory.length - 1]!,
      fullTrajectory,
      retireDate: entry.retire_date.toString(),
    }
  })

  return { rankCard, baseStatus, statCards, retirementSnapshot }
}
