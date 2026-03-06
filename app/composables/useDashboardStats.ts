import type { Tables } from '#shared/types/database'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

type SeniorityEntry = Tables<'seniority_entries'>
type FilterFn = (entry: SeniorityEntry) => boolean

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
 * Generate time points: monthly for first 5 years from startDate, yearly after, until endDate.
 */
export function generateTimePoints(startDate: Date, endDate: Date): Date[] {
  const points: Date[] = []
  const fiveYearsOut = new Date(startDate)
  fiveYearsOut.setFullYear(fiveYearsOut.getFullYear() + 5)

  // Monthly for first 5 years
  const current = new Date(startDate)
  while (current <= endDate && current <= fiveYearsOut) {
    points.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }

  // Yearly after 5 years
  if (current <= endDate) {
    // Align to next year boundary from fiveYearsOut
    const yearlyStart = new Date(fiveYearsOut)
    yearlyStart.setFullYear(yearlyStart.getFullYear() + 1)
    yearlyStart.setMonth(startDate.getMonth())
    yearlyStart.setDate(startDate.getDate())
    const yearly = new Date(yearlyStart)
    while (yearly <= endDate) {
      points.push(new Date(yearly))
      yearly.setFullYear(yearly.getFullYear() + 1)
    }
  }

  return points
}

/**
 * Build trajectory: for each time point, compute adjusted rank.
 */
export function buildTrajectory(
  entries: SeniorityEntry[],
  userSenNum: number,
  timePoints: Date[],
  filterFn?: FilterFn,
): { date: string; rank: number }[] {
  return timePoints.map((tp) => {
    const retired = countRetiredAbove(entries, userSenNum, tp, filterFn)
    return {
      date: tp.toISOString().split('T')[0],
      rank: userSenNum - retired,
    }
  })
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
    const percentile = total > 0 ? ((total - adjustedSeniority + 1) / total) * 100 : 0

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

    const retirementsThisYear = entries.filter((e) => {
      if (!e.retire_date) return false
      return new Date(e.retire_date).getFullYear() === currentYear
    }).length

    // Compute base rank for user
    let baseRankValue = '--'
    const entry = userEntry.value
    if (entry && entry.base) {
      const baseEntries = entries.filter((e) => e.base === entry.base)
      const rawRank = baseEntries.filter((e) => e.seniority_number < entry.seniority_number).length + 1
      const today = new Date()
      const baseFilter: FilterFn = (e) => e.base === entry.base
      const retired = countRetiredAbove(entries, entry.seniority_number, today, baseFilter)
      baseRankValue = formatNumber(rawRank - retired)
    }

    return [
      {
        label: 'Total Pilots',
        value: formatNumber(entries.length),
        trend: undefined as string | undefined,
        trendUp: undefined as boolean | undefined,
        icon: 'i-lucide-users',
      },
      {
        label: 'Retirements This Year',
        value: formatNumber(retirementsThisYear),
        trend: undefined as string | undefined,
        trendUp: undefined as boolean | undefined,
        icon: 'i-lucide-calendar-clock',
      },
      {
        label: 'Your Base Rank',
        value: baseRankValue,
        trend: undefined as string | undefined,
        trendUp: undefined as boolean | undefined,
        icon: 'i-lucide-map-pin',
      },
      {
        label: 'Lists Uploaded',
        value: formatNumber(lists.length),
        trend: undefined as string | undefined,
        trendUp: undefined as boolean | undefined,
        icon: 'i-lucide-file-text',
      },
    ]
  })

  // --- BASE/SEAT/FLEET STATUS ---
  const baseStatusData = computed(() => {
    const entries = seniorityStore.entries
    const entry = userEntry.value
    const today = new Date()

    // Get all unique base/seat/fleet combos
    const combos = new Map<string, { base: string; seat: string; fleet: string }>()
    for (const e of entries) {
      if (!e.base || !e.seat || !e.fleet) continue
      const key = `${e.base}|${e.seat}|${e.fleet}`
      if (!combos.has(key)) {
        combos.set(key, { base: e.base, seat: e.seat, fleet: e.fleet })
      }
    }

    return Array.from(combos.entries()).map(([key, combo]) => {
      const filterFn: FilterFn = (e) => e.base === combo.base && e.seat === combo.seat && e.fleet === combo.fleet
      const comboEntries = entries.filter(filterFn)
      const total = comboEntries.length

      let rank = 0
      let adjustedRank = 0
      let percentile = 0
      let isUserCurrent = false

      if (entry) {
        rank = comboEntries.filter((e) => e.seniority_number < entry.seniority_number).length + 1
        const retired = countRetiredAbove(entries, entry.seniority_number, today, filterFn)
        adjustedRank = rank - retired
        percentile = total > 0 ? Math.round(((total - adjustedRank + 1) / total) * 100 * 10) / 10 : 0
        isUserCurrent = entry.base === combo.base && entry.seat === combo.seat && entry.fleet === combo.fleet
      }

      return {
        base: combo.base,
        seat: combo.seat,
        fleet: combo.fleet,
        rank,
        adjustedRank,
        total,
        percentile,
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

    const today = new Date()
    let endDate: Date
    if (entry.retire_date) {
      endDate = new Date(entry.retire_date)
    } else {
      endDate = new Date(today)
      endDate.setFullYear(endDate.getFullYear() + 10)
    }

    const timePoints = generateTimePoints(today, endDate)
    const trajectory = buildTrajectory(entries, entry.seniority_number, timePoints)

    return {
      labels: trajectory.map((t) => t.date),
      data: trajectory.map((t) => t.rank),
    }
  })

  // --- RETIREMENT PROJECTIONS ---
  function computeRetirementProjection(filterFn: FilterFn = () => true): { labels: string[]; data: number[] } {
    const entry = userEntry.value
    const entries = seniorityStore.entries

    if (!entry) {
      return { labels: [], data: [] }
    }

    const today = new Date()
    let endDate: Date
    if (entry.retire_date) {
      endDate = new Date(entry.retire_date)
    } else {
      endDate = new Date(today)
      endDate.setFullYear(endDate.getFullYear() + 10)
    }

    const timePoints = generateTimePoints(today, endDate)
    if (timePoints.length === 0) {
      return { labels: [], data: [] }
    }

    const labels: string[] = []
    const data: number[] = []

    for (let i = 0; i < timePoints.length; i++) {
      const bucketStart = i === 0 ? today : timePoints[i - 1]
      const bucketEnd = timePoints[i]

      const count = entries.filter((e) => {
        if (!e.retire_date) return false
        if (!filterFn(e)) return false
        const rd = new Date(e.retire_date)
        return rd > bucketStart && rd <= bucketEnd
      }).length

      labels.push(formatDate(bucketEnd.toISOString().split('T')[0]))
      data.push(count)
    }

    return { labels, data }
  }

  // --- COMPARATIVE TRAJECTORY ---
  function computeComparativeTrajectory(
    currentFilter: FilterFn,
    compareFilter: FilterFn,
  ): { labels: string[]; currentData: number[]; compareData: number[] } {
    const entry = userEntry.value
    const entries = seniorityStore.entries

    if (!entry) {
      return { labels: [], currentData: [], compareData: [] }
    }

    const today = new Date()
    let endDate: Date
    if (entry.retire_date) {
      endDate = new Date(entry.retire_date)
    } else {
      endDate = new Date(today)
      endDate.setFullYear(endDate.getFullYear() + 10)
    }

    const timePoints = generateTimePoints(today, endDate)
    const currentTrajectory = buildTrajectory(entries, entry.seniority_number, timePoints, currentFilter)
    const compareTrajectory = buildTrajectory(entries, entry.seniority_number, timePoints, compareFilter)

    return {
      labels: currentTrajectory.map((t) => t.date),
      currentData: currentTrajectory.map((t) => t.rank),
      compareData: compareTrajectory.map((t) => t.rank),
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
      title: `${formatDate(list.effective_date)} Seniority List`,
      description: 'Uploaded',
      icon: 'i-lucide-file-text',
      date: list.effective_date,
    }))
  })

  // --- FILTER OPTIONS ---
  const filterOptions = computed(() => {
    const entries = seniorityStore.entries
    const bases = new Set<string>()
    const seats = new Set<string>()
    const fleets = new Set<string>()

    for (const e of entries) {
      if (e.base) bases.add(e.base)
      if (e.seat) seats.add(e.seat)
      if (e.fleet) fleets.add(e.fleet)
    }

    return {
      bases: Array.from(bases).sort(),
      seats: Array.from(seats).sort(),
      fleets: Array.from(fleets).sort(),
    }
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
    filterOptions,
  }
}
