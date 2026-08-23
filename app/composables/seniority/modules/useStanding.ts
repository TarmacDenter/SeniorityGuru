import type { ComputedRef } from 'vue'
import { formatQualification, formatSeniorityCount } from '~/utils/seniority'
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
  atRetirement: { date: string; rank: number; percentile: number }
  fullTrajectory: { date: string; rank: number; percentile: number }[]
  retireDate: string
}

export function useStanding(): {
  rankCard: ComputedRef<RankCardData>
  baseStatus: ComputedRef<BaseStatusRow[]>
  statCards: ComputedRef<StatCard[]>
  retirementSnapshot: ComputedRef<RetirementSnapshotData | null>
} {
  const { lens, anchoredLens, userEntry, projectionEndDate } = useSeniorityCore()
  const seniorityStore = useSeniorityStore()

  const standingResult = computed(() => anchoredLens.value?.seniorityStanding() ?? null)

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
      const userQualification = standing.qualificationStandings.find(
        item => item.qualification.base === entry.base
          && item.qualification.seat === entry.seat
          && item.qualification.fleet === entry.fleet,
      )
      if (userQualification) {
        baseRankValue = formatSeniorityCount(userQualification.activeRank)
        baseRankLabel = formatQualification({ base: entry.base, seat: entry.seat, fleet: entry.fleet })
      }
    }

    return [
      {
        label: 'Total Pilots',
        value: formatSeniorityCount(entries.length),
        icon: 'i-lucide-users',
      },
      {
        label: 'Retirements (Next 12 mo.)',
        value: formatSeniorityCount(lens.value?.retirementsNext12Months() ?? 0),
        trend: entry && standing
          ? `${formatSeniorityCount(standing.rollingNext12MonthRetirementsSeniorToAnchor)} senior to you`
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
        value: formatSeniorityCount(lists.length),
        icon: 'i-lucide-file-text',
      },
    ]
  })

  const trajectoryResult = computed(() => projectionEndDate.value
    ? anchoredLens.value?.seniorityTrajectory({ through: projectionEndDate.value }) ?? null
    : null)

  const retirementSnapshot = computed<RetirementSnapshotData | null>(() => {
    const entry = userEntry.value
    const traj = trajectoryResult.value
    if (!entry?.retire_date || !traj || traj.points.length === 0) return null
    return {
      atRetirement: { ...traj.points[traj.points.length - 1]!, date: traj.points[traj.points.length - 1]!.date.toString() },
      fullTrajectory: traj.points.map(point => ({ ...point, date: point.date.toString() })),
      retireDate: entry.retire_date.toString(),
    }
  })

  return { rankCard, baseStatus, statCards, retirementSnapshot }
}
