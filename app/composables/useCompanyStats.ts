import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'
import { formatDateLabel } from '#shared/utils/seniority-math'
import { useSeniorityStore } from '~/stores/seniority'
import { useSeniorityEngine } from './useSeniorityEngine'

type SeniorityEntry = SeniorityEntryResponse

export function useCompanyStats() {
  const seniorityStore = useSeniorityStore()
  const { snapshot } = useSeniorityEngine()

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

  const recentLists = computed(() => {
    return seniorityStore.lists.map((list) => ({
      id: list.id,
      title: `${formatDateLabel(list.effective_date)} Seniority List`,
      description: 'Uploaded',
      icon: 'i-lucide-file-text',
      date: list.effective_date,
    }))
  })

  // Use snapshot quals instead of rebuilding from entries
  const quals = computed(() => {
    if (!snapshot.value) return []
    return [...snapshot.value.quals]
  })

  return {
    aggregateStats,
    recentLists,
    quals,
  }
}
