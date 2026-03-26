import type { ComputedRef } from 'vue'
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

export function useCompanyOverview(): {
  aggregateStats: ComputedRef<FleetBaseGroup[]>
  recentLists: ComputedRef<RecentList[]>
  quals: ComputedRef<Qual[]>
} {
  const seniorityStore = useSeniorityStore()
  const { snapshot } = useSeniorityCore()

  const aggregateStats = computed<FleetBaseGroup[]>(() => {
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

    const now = todayISO()

    return Array.from(groups.entries()).map(([category, groupEntries]) => {
      const totalPilots = groupEntries.length
      const avgSeniority = groupEntries.reduce((sum, e) => sum + e.seniority_number, 0) / totalPilots

      const entriesWithRetireDate = groupEntries.filter(e => e.retire_date)
      const avgYearsToRetire = entriesWithRetireDate.length > 0
        ? entriesWithRetireDate.reduce((sum, e) => {
            return sum + diffYears(now, e.retire_date!)
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
