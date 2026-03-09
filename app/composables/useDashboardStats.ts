import type { Tables } from '#shared/types/database'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

type SeniorityEntry = Tables<'seniority_entries'>
type FilterFn = (entry: SeniorityEntry) => boolean

interface StatCard {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
}

/**
 * Count entries senior to user (lower seniority_number) that have retired by asOfDate.
 * Only counts entries matching optional filterFn.
 */
export function countRetiredAbove(
  entries: SeniorityEntry[],
  userSenNum: number,
  asOfDate: Date,
  filterFn?: FilterFn,
): number {
  let count = 0
  for (const entry of entries) {
    if (entry.seniority_number >= userSenNum) continue
    if (!entry.retire_date) continue
    if (new Date(entry.retire_date) > asOfDate) continue
    if (filterFn && !filterFn(entry)) continue
    count++
  }
  return count
}

/**
 * Generate time points: yearly intervals from startDate until endDate.
 */
export function generateTimePoints(startDate: Date, endDate: Date): Date[] {
  const points: Date[] = []
  const current = new Date(startDate)

  // Always use yearly intervals
  while (current <= endDate) {
    points.push(new Date(current))
    current.setFullYear(current.getFullYear() + 1)
  }

  return points
}

/**
 * Build trajectory: for each time point, compute rank within the (optionally filtered) set.
 * Rank = number of non-retired pilots ahead of user in the filtered set + 1.
 */
export function buildTrajectory(
  entries: SeniorityEntry[],
  userSenNum: number,
  timePoints: Date[],
  filterFn?: FilterFn,
): { date: string; rank: number; percentile: number }[] {
  // Pre-filter entries to the category
  const filtered = filterFn ? entries.filter(filterFn) : entries
  const totalInCategory = filtered.length
  // Count pilots ahead of user in the filtered set (lower seniority_number)
  const aheadInCategory = filtered.filter((e) => e.seniority_number < userSenNum)
  const initialRank = aheadInCategory.length + 1

  return timePoints.map((tp) => {
    // Count how many of those ahead have retired by this time point
    let retiredAhead = 0
    for (const e of aheadInCategory) {
      if (!e.retire_date) continue
      if (new Date(e.retire_date) <= tp) retiredAhead++
    }
    const rank = initialRank - retiredAhead
    // Use static denominator (initial category size) to avoid wild swings as pool shrinks
    // Invert: 100% = most senior (#1), 0% = most junior (last)
    const percentile = totalInCategory > 0
      ? Math.round(((totalInCategory - rank + 1) / totalInCategory) * 1000) / 10
      : 0
    return {
      date: tp.toISOString().split('T')[0]!,
      rank,
      percentile,
    }
  })
}

function computeRank(entries: SeniorityEntry[], userSenNum: number): number {
  return entries.filter((e) => e.seniority_number < userSenNum).length + 1
}

function getProjectionEndDate(retireDate: string | null): { today: Date; endDate: Date } {
  const today = new Date()
  const endDate = retireDate
    ? new Date(retireDate)
    : new Date(today.getFullYear() + 30, today.getMonth(), today.getDate())
  return { today, endDate }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

export function useDashboardStats() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  // Find user's entry by matching employee_number
  const userEntry = computed<SeniorityEntry | undefined>(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    return seniorityStore.entries.find((e) => e.employee_number === empNum)
  })

  // State flags
  const hasData = computed(() => seniorityStore.entries.length > 0)
  const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number)
  const userFound = computed(() => !!userEntry.value)

  // --- RANK CARD ---
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

  // --- STATS GRID (4 cards) ---
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

    // Count how many retiring this year are senior to (ahead of) the user
    let retiringSeniorToMe = 0
    if (entry) {
      retiringSeniorToMe = retiringThisYear.filter(
        (e) => e.seniority_number < entry.seniority_number,
      ).length
    }

    // Compute rank for user's seat/fleet/base combo
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
        trendUp: retiringSeniorToMe > 0 ? true : undefined,
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

  // --- BASE/SEAT/FLEET STATUS ---
  const baseStatusData = computed(() => {
    const entries = seniorityStore.entries
    const entry = userEntry.value
    const today = new Date()

    // Group entries by combo key in a single pass
    const grouped = new Map<string, SeniorityEntry[]>()
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

      // Count already-retired pilots in this combo (retired as of today)
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

  // --- TRAJECTORY ---
  const trajectoryData = computed(() => {
    const entry = userEntry.value
    const entries = seniorityStore.entries

    if (!entry) {
      return { labels: [] as string[], data: [] as number[] }
    }

    const { today, endDate } = getProjectionEndDate(entry.retire_date)
    const timePoints = generateTimePoints(today, endDate)
    const trajectory = buildTrajectory(entries, entry.seniority_number, timePoints)

    return {
      labels: trajectory.map((t) => t.date),
      data: trajectory.map((t) => t.percentile),
    }
  })

  // --- RETIREMENT PROJECTIONS ---
  function computeRetirementProjection(filterFn: FilterFn = () => true): { labels: string[]; data: number[]; filteredTotal: number } {
    const entry = userEntry.value
    const entries = seniorityStore.entries

    if (!entry) {
      return { labels: [], data: [], filteredTotal: 0 }
    }

    const filteredEntries = entries.filter(filterFn)
    const filteredTotal = filteredEntries.length

    const { today, endDate } = getProjectionEndDate(entry.retire_date)
    const timePoints = generateTimePoints(today, endDate)
    if (timePoints.length === 0) {
      return { labels: [], data: [], filteredTotal }
    }

    const labels: string[] = []
    const data: number[] = []

    for (let i = 0; i < timePoints.length; i++) {
      const bucketStart = i === 0 ? today : timePoints[i - 1]!
      const bucketEnd = timePoints[i]!

      const count = filteredEntries.filter((e) => {
        if (!e.retire_date) return false
        const rd = new Date(e.retire_date)
        return rd > bucketStart && rd <= bucketEnd
      }).length

      labels.push(formatDate(bucketEnd.toISOString().split('T')[0]!))
      data.push(count)
    }

    return { labels, data, filteredTotal }
  }

  // --- COMPARATIVE TRAJECTORY ---
  function computeComparativeTrajectory(
    currentFilter: FilterFn,
    compareFilter: FilterFn,
  ): { labels: string[]; currentData: number[]; compareData: number[] } {
    const entry = userEntry.value
    const allEntries = seniorityStore.entries

    if (!entry) {
      return { labels: [], currentData: [], compareData: [] }
    }

    const { endDate } = getProjectionEndDate(entry.retire_date)
    const today = new Date()

    // Ensure the user's entry is included in the set for hypothetical projections.
    // If the user selects a category they're not in, their entry won't match the filter,
    // so buildTrajectory still works — it computes where the user would slot in by
    // seniority number. We pass all entries so buildTrajectory can filter internally.
    const timePoints = generateTimePoints(today, endDate)
    const currentTrajectory = buildTrajectory(allEntries, entry.seniority_number, timePoints, currentFilter)
    const compareTrajectory = buildTrajectory(allEntries, entry.seniority_number, timePoints, compareFilter)

    return {
      labels: currentTrajectory.map((t) => t.date),
      currentData: currentTrajectory.map((t) => t.percentile),
      compareData: compareTrajectory.map((t) => t.percentile),
    }
  }

  // --- AGGREGATE STATS ---
  const aggregateStats = computed(() => {
    const entries = seniorityStore.entries
    const groups = new Map<string, SeniorityEntry[]>()

    for (const e of entries) {
      if (!e.fleet || !e.base) continue
      const key = `${e.fleet} / ${e.base}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(e)
    }

    const now = new Date()

    return Array.from(groups.entries()).map(([category, groupEntries]) => {
      const totalPilots = groupEntries.length
      const avgSeniority = groupEntries.reduce((sum, e) => sum + e.seniority_number, 0) / totalPilots

      const entriesWithRetireDate = groupEntries.filter((e) => e.retire_date)
      const avgYearsToRetire = entriesWithRetireDate.length > 0
        ? entriesWithRetireDate.reduce((sum, e) => {
            const rd = new Date(e.retire_date!)
            const years = (rd.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
            return sum + years
          }, 0) / entriesWithRetireDate.length
        : 0

      return {
        category,
        avgSeniority: Math.round(avgSeniority * 10) / 10,
        avgYearsToRetire: Math.round(avgYearsToRetire * 10) / 10,
        totalPilots,
      }
    })
  })

  // --- RECENT LISTS ---
  const recentLists = computed(() => {
    return seniorityStore.lists.map((list) => ({
      id: list.id,
      title: `${formatDate(list.effective_date)} Seniority List`,
      description: 'Uploaded',
      icon: 'i-lucide-file-text',
      date: list.effective_date,
    }))
  })

  // --- QUALS (actual seat/fleet/base combos from seniority data) ---
  const quals = computed(() => {
    const entries = seniorityStore.entries
    const seen = new Set<string>()
    const result: { seat: string; fleet: string; base: string; label: string }[] = []

    for (const e of entries) {
      if (!e.seat || !e.fleet || !e.base) continue
      const key = `${e.seat}/${e.fleet}/${e.base}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push({ seat: e.seat, fleet: e.fleet, base: e.base, label: key })
    }

    return result.sort((a, b) => a.label.localeCompare(b.label))
  })

  return {
    hasData,
    hasEmployeeNumber,
    userFound,
    rankCard,
    stats,
    baseStatusData,
    trajectoryData,
    computeRetirementProjection,
    computeComparativeTrajectory,
    aggregateStats,
    recentLists,
    quals,
  }
}
