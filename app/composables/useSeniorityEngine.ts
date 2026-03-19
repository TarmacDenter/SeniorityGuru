import type { SenioritySnapshot, SeniorityLens, PilotAnchor } from '#shared/utils/seniority-engine'
import { createSnapshot, createLens } from '#shared/utils/seniority-engine'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserEntry } from './useUserEntry'

export function useSeniorityEngine() {
  const seniorityStore = useSeniorityStore()
  const userEntry = useUserEntry({ withNewHireMode: true })

  const snapshot = computed<SenioritySnapshot | null>(() => {
    if (seniorityStore.entries.length === 0) return null
    return createSnapshot(seniorityStore.entries)
  })

  const lens = computed<SeniorityLens | null>(() => {
    if (!snapshot.value) return null
    const entry = userEntry.value
    if (!entry) return null
    const anchor: PilotAnchor = {
      seniorityNumber: entry.seniority_number,
      retireDate: entry.retire_date,
      employeeNumber: entry.employee_number,
    }
    return createLens(snapshot.value, anchor)
  })

  return { snapshot, lens }
}
