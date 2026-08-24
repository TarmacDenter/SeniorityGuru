import type { ComputedRef } from 'vue'
import { useSeniorityStore } from '~/stores/seniority'
import { useSeniorityCore } from './useSeniorityCore'

export interface RankCardData {
  seniorityNumber: number
  activeRank: number
  percentile: number
  base: string
  seat: string
  fleet: string
  hireDate: string
}

export interface BaseStatusRow {
  base: string
  seat: string
  fleet: string
  listRank: number
  activeRank: number
  listPilotCount: number
  activePilotCount: number
  listPercentile: number
  activePercentile: number
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
  const { analysis, anchoredAnalysis, userEntry, projectionEndDate } = useSeniorityCore()
  const seniorityStore = useSeniorityStore()

  const standingOutput = computed(() => anchoredAnalysis.value?.seniorityStanding() ?? null)
  const standingResult = computed(() => standingOutput.value?.domain ?? null)

  const rankCard = computed<RankCardData>(() => {
    const entry = userEntry.value
    const standing = standingResult.value
    if (!entry || !standing) {
      return {
        seniorityNumber: 0,
        activeRank: 0,
        percentile: 0,
        base: '--',
        seat: '--',
        fleet: '--',
        hireDate: '--',
      }
    }
    return {
      seniorityNumber: entry.seniority_number,
      activeRank: standing.activeRank,
      percentile: standing.activePercentile,
      base: entry.base ?? '--',
      seat: entry.seat ?? '--',
      fleet: entry.fleet ?? '--',
      hireDate: entry.hire_date.toString(),
    }
  })

  const baseStatus = computed<BaseStatusRow[]>(() => {
    const standing = standingResult.value
    if (!standing) return []
    return standing.qualificationStandings.map(row => ({
      base: row.qualification.base,
      seat: row.qualification.seat,
      fleet: row.qualification.fleet,
      listRank: row.listRank,
      activeRank: row.activeRank,
      listPilotCount: row.listPilotCount,
      activePilotCount: row.activePilotCount,
      listPercentile: row.listPercentile,
      activePercentile: row.activePercentile,
      isAnchorCurrentQualification: row.isAnchorCurrentQualification,
    }))
  })

  const statCards = computed<StatCard[]>(() => {
    const entries = seniorityStore.entries
    const lists = seniorityStore.lists
    const entry = userEntry.value
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
        baseRankValue = userQualification.activeRank.toLocaleString()
        baseRankLabel = userQualification.qualificationLabel
      }
    }

    return [
      {
        label: 'Total Pilots',
        value: entries.length.toLocaleString(),
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

  const retirementSnapshot = computed<RetirementSnapshotData | null>(() => {
    const entry = userEntry.value
    const traj = trajectoryResult.value
    if (!entry?.retire_date || !traj || traj.points.length === 0) return null
    const fullTrajectory = traj.points.map((point, index, points) => {
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
