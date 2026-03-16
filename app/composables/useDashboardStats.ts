import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'
import {
  countRetiredAbove,
  computeRank,
  formatNumber,
  type FilterFn,
} from '#shared/utils/seniority-math'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useNewHireMode } from './useNewHireMode'
import { useUserEntry } from './useUserEntry'
import { useUserTrajectory } from './useUserTrajectory'
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
  const userEntry = useUserEntry({ withNewHireMode: true })

  const hasData = computed(() => seniorityStore.entries.length > 0)
  const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number)
  const userFound = computed(() => !!userEntry.value)

  const rankCard = computed(() => {
    const entry = userEntry.value
    if (!entry) {
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

    const entries = seniorityStore.entries
    const total = entries.length
    const today = new Date()
    const retired = countRetiredAbove(entries, entry.seniority_number, today)
    const adjustedSeniority = entry.seniority_number - retired
    const percentile = total > 0 ? (adjustedSeniority / total) * 100 : 0

    return {
      seniorityNumber: entry.seniority_number,
      adjustedSeniority,
      percentile: Math.round(percentile * 10) / 10,
      base: entry.base ?? '--',
      seat: entry.seat ?? '--',
      fleet: entry.fleet ?? '--',
      hireDate: entry.hire_date,
    }
  })

  const stats = computed(() => {
    const entries = seniorityStore.entries
    const lists = seniorityStore.lists
    const currentYear = new Date().getFullYear()

    const entry = userEntry.value

    const retiringThisYear = entries.filter((e) => {
      if (!e.retire_date) return false
      return new Date(e.retire_date).getFullYear() === currentYear
    })
    const retirementsThisYear = retiringThisYear.length

    let retiringSeniorToMe = 0
    if (entry) {
      retiringSeniorToMe = retiringThisYear.filter(
        (e) => e.seniority_number < entry.seniority_number,
      ).length
    }

    let baseRankValue = '--'
    let baseRankLabel = 'Your Base Rank'
    if (entry && entry.base && entry.seat && entry.fleet) {
      const comboFilter: FilterFn = (e) =>
        e.seat === entry.seat && e.fleet === entry.fleet && e.base === entry.base
      const comboEntries = entries.filter(comboFilter)
      const rawRank = computeRank(comboEntries, entry.seniority_number)
      const today = new Date()
      const retired = countRetiredAbove(entries, entry.seniority_number, today, comboFilter)
      baseRankValue = formatNumber(rawRank - retired)
      baseRankLabel = `${entry.seat}/${entry.fleet}/${entry.base}`
    }

    const cards: StatCard[] = [
      {
        label: 'Total Pilots',
        value: formatNumber(entries.length),
        icon: 'i-lucide-users',
      },
      {
        label: 'Retirements This Year',
        value: formatNumber(retirementsThisYear),
        trend: entry ? `${formatNumber(retiringSeniorToMe)} senior to you` : undefined,
        trendUp: retiringSeniorToMe > 0 || undefined,
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
    const entries = seniorityStore.entries
    const entry = userEntry.value
    const today = new Date()

    const grouped = new Map<string, SeniorityEntryResponse[]>()
    for (const e of entries) {
      if (!e.base || !e.seat || !e.fleet) continue
      const key = `${e.base}|${e.seat}|${e.fleet}`
      let group = grouped.get(key)
      if (!group) { group = []; grouped.set(key, group) }
      group.push(e)
    }

    return Array.from(grouped.values()).map((comboEntries) => {
      const { base, seat, fleet } = comboEntries[0]!
      const total = comboEntries.length

      const retiredInCombo = comboEntries.filter((e) => {
        if (!e.retire_date) return false
        return new Date(e.retire_date) <= today
      }).length
      const adjustedTotal = total - retiredInCombo

      let rank = 0
      let adjustedRank = 0
      let percentile = 0
      let adjustedPercentile = 0
      let isUserCurrent = false

      if (entry) {
        rank = computeRank(comboEntries, entry.seniority_number)
        const retired = countRetiredAbove(comboEntries, entry.seniority_number, today)
        adjustedRank = rank - retired
        percentile = total > 0 ? Math.round((rank / total) * 100 * 10) / 10 : 0
        adjustedPercentile = adjustedTotal > 0 ? Math.round((adjustedRank / adjustedTotal) * 100 * 10) / 10 : 0
        isUserCurrent = entry.base === base && entry.seat === seat && entry.fleet === fleet
      }

      return {
        base: base!,
        seat: seat!,
        fleet: fleet!,
        rank,
        adjustedRank,
        total,
        adjustedTotal,
        percentile,
        adjustedPercentile,
        isUserCurrent,
      }
    })
  })

  const { fullTrajectory, trajectoryChartData, trajectoryDeltas, computeRetirementProjection, computeComparativeTrajectory } = useUserTrajectory()

  const retirementSnapshot = computed(() => {
    const entry = userEntry.value
    if (!entry?.retire_date) return null
    const trajectory = fullTrajectory.value
    if (trajectory.length === 0) return null
    const atRetirement = trajectory[trajectory.length - 1]!
    return {
      atRetirement,
      fullTrajectory: trajectory,
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
