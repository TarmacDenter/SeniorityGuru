import type { SenioritySnapshot, SeniorityLens, PilotAnchor } from '#shared/utils/seniority-engine'
import { createSnapshot, createLens } from '#shared/utils/seniority-engine'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

export function useSeniorityEngine() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  const snapshot = computed<SenioritySnapshot | null>(() => {
    if (seniorityStore.entries.length === 0) return null
    return createSnapshot([...seniorityStore.entries])
  })

  const lens = computed<SeniorityLens | null>(() => {
    if (!snapshot.value) return null
    const empNum = userStore.profile?.employee_number
    if (!empNum) return null
    const entry = seniorityStore.entries.find(e => e.employee_number === empNum)
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
