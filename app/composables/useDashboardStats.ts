import { formatNumber } from '#shared/utils/seniority-math'
import { createScenario } from '#shared/utils/seniority-engine'
import type { QualSpec } from '#shared/utils/seniority-engine'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useNewHireMode } from './useNewHireMode'
import { useSeniorityEngine } from './useSeniorityEngine'
import { useCompanyStats } from './useCompanyStats'

interface StatCard {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
}

export function useDashboardStats() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()
  const newHireMode = useNewHireMode()
  const { snapshot, lens } = useSeniorityEngine()

  // Look up user entry from snapshot (includes synthetic entry in new-hire mode)
  const userEntry = computed(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    return snapshot.value?.byEmployeeNumber.get(empNum)
  })

  const hasData = computed(() => seniorityStore.entries.length > 0)
  const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number)
  const userFound = computed(() => !!userEntry.value)

  const standingResult = computed(() => lens.value?.standing() ?? null)

  const rankCard = computed(() => {
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
    const percentile = total > 0
      ? Math.round((standing.adjustedRank / total) * 100 * 10) / 10
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

  const stats = computed(() => {
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

    const cards: StatCard[] = [
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
    return cards
  })

  const baseStatusData = computed(() => {
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

  // Trajectory via engine
  const trajectoryResult = computed(() => lens.value?.trajectory() ?? null)

  const trajectoryChartData = computed(() =>
    trajectoryResult.value?.chartData ?? { labels: [] as string[], data: [] as number[] },
  )

  const trajectoryDeltas = computed(() => trajectoryResult.value?.deltas ?? [])

  function computeRetirementProjection(spec: QualSpec = {}) {
    if (!lens.value) return { labels: [] as string[], data: [] as number[], filteredTotal: 0 }
    return lens.value.retirementProjection(createScenario({ scopeFilter: spec }))
  }

  function computeComparativeTrajectory(specA: QualSpec, specB: QualSpec) {
    if (!lens.value) return { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
    return lens.value.compareTrajectories(
      createScenario({ scopeFilter: specA }),
      createScenario({ scopeFilter: specB }),
    ) ?? { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
  }

  const retirementSnapshot = computed(() => {
    const entry = userEntry.value
    const traj = trajectoryResult.value
    if (!entry?.retire_date || !traj || traj.points.length === 0) return null
    return {
      atRetirement: traj.points[traj.points.length - 1]!,
      fullTrajectory: traj.points,
      retireDate: entry.retire_date,
    }
  })

  const { recentLists, quals } = useCompanyStats()

  return {
    hasData,
    hasEmployeeNumber,
    userFound,
    isNewHireMode: newHireMode.isActive,
    newHireMode,
    rankCard,
    stats,
    baseStatusData,
    retirementSnapshot,
    trajectoryChartData,
    trajectoryDeltas,
    computeRetirementProjection,
    computeComparativeTrajectory,
    recentLists,
    quals,
  }
}
