import type { ComputedRef } from 'vue'
import { groupBy, map, pipe } from 'remeda'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { Qual } from '~/utils/seniority-engine'
import { diffYears, formatMonthYear, todayISO } from '~/utils/date'
import { useSeniorityStore } from '~/stores/seniority'
import { useSeniorityCore } from './useSeniorityCore'

export interface FleetBaseGroup {
  category: string
  avgSeniority: number
  avgYearsToRetire: number
  totalPilots: number
}

export interface RecentList {
  id: number
  title: string
  description: string
  icon: string
  date: string
}

function toFleetBaseKey(entry: SeniorityEntry): string | undefined {
  if (!entry.fleet || !entry.base) return undefined
  return `${entry.fleet} / ${entry.base}`
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function calcAvgYearsToRetire(entries: SeniorityEntry[], now: string): number {
  const entriesWithRetireDate = entries.filter(entry => !!entry.retire_date)
  if (entriesWithRetireDate.length === 0) return 0

  const totalYears = entriesWithRetireDate.reduce(
    (sum, entry) => sum + diffYears(now, entry.retire_date!),
    0,
  )
  return totalYears / entriesWithRetireDate.length
}

function toFleetBaseGroup(category: string, entries: SeniorityEntry[], now: string): FleetBaseGroup {
  const totalPilots = entries.length
  const avgSeniority = entries.reduce((sum, entry) => sum + entry.seniority_number, 0) / totalPilots

  return {
    category,
    avgSeniority: roundTenth(avgSeniority),
    avgYearsToRetire: roundTenth(calcAvgYearsToRetire(entries, now)),
    totalPilots,
  }
}

export function useCompanyOverview(): {
  aggregateStats: ComputedRef<FleetBaseGroup[]>
  recentLists: ComputedRef<RecentList[]>
  quals: ComputedRef<Qual[]>
} {
  const seniorityStore = useSeniorityStore()
  const { snapshot } = useSeniorityCore()

  const aggregateStats = computed<FleetBaseGroup[]>(() => {
    const now = todayISO()

    return pipe(
      seniorityStore.entries,
      groupBy(toFleetBaseKey),
      Object.entries,
      map(([category, entries]) => toFleetBaseGroup(category, entries, now)),
    )
  })

  const recentLists = computed<RecentList[]>(() => {
    return seniorityStore.lists.map(list => ({
      id: list.id!,
      title: `${formatMonthYear(list.effectiveDate)} Seniority List`,
      description: 'Uploaded',
      icon: 'i-lucide-file-text',
      date: list.effectiveDate,
    }))
  })

  const quals = computed<Qual[]>(() => {
    if (!snapshot.value) return []
    return [...snapshot.value.quals]
  })

  return { aggregateStats, recentLists, quals }
}
