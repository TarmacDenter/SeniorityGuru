import type { ComputedRef } from 'vue'
import { formatNumber } from '~/utils/seniority-math'
import type { TrajectoryPoint } from '~/utils/seniority-engine'
import { useSeniorityStore } from '~/stores/seniority'
import { useSeniorityCore } from './useSeniorityCore'

export interface RankCardData {
  seniorityNumber: number
  adjustedSeniority: number
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
  rank: number
  adjustedRank: number
  total: number
  adjustedTotal: number
  percentile: number
  adjustedPercentile: number
  isUserCurrent: boolean
}

export interface StatCard {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
}

export interface RetirementSnapshotData {
  atRetirement: TrajectoryPoint
  fullTrajectory: TrajectoryPoint[]
  retireDate: string
}

export function useStanding(): {
  rankCard: ComputedRef<RankCardData>
  baseStatus: ComputedRef<BaseStatusRow[]>
  statCards: ComputedRef<StatCard[]>
  retirementSnapshot: ComputedRef<RetirementSnapshotData | null>
} {
  const { lens, userEntry } = useSeniorityCore()
  const seniorityStore = useSeniorityStore()

  const standingResult = computed(() => lens.value?.standing() ?? null)

  const rankCard = computed<RankCardData>(() => {
    const entry = userEntry.value
    const standing = standingResult.value
    if (!entry || !standing) {
      return {
        seniorityNumber: 0,
        adjustedSeniority: 0,
        percentile: 0,
        base: '--',
        seat: '--',
        fleet: '--',
        hireDate: '--',
      }
    }
    const total = standing.total
    const safeRank = Number.isFinite(standing.adjustedRank) ? standing.adjustedRank : 0
    const percentile = total > 0
      ? Math.round((safeRank / total) * 100 * 10) / 10
      : 0
    return {
      seniorityNumber: entry.seniority_number,
      adjustedSeniority: standing.adjustedRank,
      percentile,
      base: entry.base ?? '--',
      seat: entry.seat ?? '--',
      fleet: entry.fleet ?? '--',
      hireDate: entry.hire_date,
    }
  })

  const baseStatus = computed<BaseStatusRow[]>(() => {
    const standing = standingResult.value
    if (!standing) return []
    return standing.cellBreakdown.map(row => ({
      base: row.base,
      seat: row.seat,
      fleet: row.fleet,
      rank: row.rank,
      adjustedRank: row.adjustedRank,
      total: row.total,
      adjustedTotal: row.adjustedTotal,
      percentile: row.percentile,
      adjustedPercentile: row.adjustedPercentile,
      isUserCurrent: row.isAnchorCurrent,
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
      const userCell = standing.cellBreakdown.find(
        c => c.base === entry.base && c.seat === entry.seat && c.fleet === entry.fleet,
      )
      if (userCell) {
        baseRankValue = formatNumber(userCell.adjustedRank)
        baseRankLabel = `${entry.seat}/${entry.fleet}/${entry.base}`
      }
    }

    return [
      {
        label: 'Total Pilots',
        value: formatNumber(entries.length),
        icon: 'i-lucide-users',
      },
      {
        label: 'Retirements This Year',
        value: formatNumber(standing?.retirementsThisYear ?? 0),
        trend: entry && standing
          ? `${formatNumber(standing.retirementsThisYearSeniorToAnchor)} senior to you`
          : undefined,
        trendUp: (standing?.retirementsThisYearSeniorToAnchor ?? 0) > 0 || undefined,
        icon: 'i-lucide-calendar-clock',
      },
      {
        label: baseRankLabel,
        value: baseRankValue,
        icon: 'i-lucide-map-pin',
      },
      {
        label: 'Lists Uploaded',
        value: formatNumber(lists.length),
        icon: 'i-lucide-file-text',
      },
    ]
  })

  const trajectoryResult = computed(() => lens.value?.trajectory() ?? null)

  const retirementSnapshot = computed<RetirementSnapshotData | null>(() => {
    const entry = userEntry.value
    const traj = trajectoryResult.value
    if (!entry?.retire_date || !traj || traj.points.length === 0) return null
    return {
      atRetirement: traj.points[traj.points.length - 1]!,
      fullTrajectory: traj.points,
      retireDate: entry.retire_date,
    }
  })

  return { rankCard, baseStatus, statCards, retirementSnapshot }
}
