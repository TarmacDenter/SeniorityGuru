import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import type { SenioritySnapshot, SeniorityLens, PilotAnchor } from '#shared/utils/seniority-engine'
import { createSnapshot, createLens } from '#shared/utils/seniority-engine'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useNewHireMode } from './useNewHireMode'

export function useSeniorityEngine() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()
  const newHireMode = useNewHireMode()

  const snapshot = computed<SenioritySnapshot | null>(() => {
    if (seniorityStore.entries.length === 0) return null
    const baseEntries: SeniorityEntry[] = [...seniorityStore.entries]
    const synthetic = newHireMode.syntheticEntry.value
    if (newHireMode.isActive.value && synthetic) {
      baseEntries.push(synthetic)
    }
    return createSnapshot(baseEntries)
  })

  const lens = computed<SeniorityLens | null>(() => {
    if (!snapshot.value) return null
    // Try real entry first, fall back to synthetic entry for new-hire mode
    const empNum = userStore.profile?.employee_number
    if (!empNum) return null
    const entry = seniorityStore.entries.find(e => e.employee_number === empNum)
      ?? (newHireMode.isActive.value ? newHireMode.syntheticEntry.value : null)
    if (!entry) return null
    const anchor: PilotAnchor = {
      seniorityNumber: entry.seniority_number,
      retireDate: entry.retire_date ?? null,
      employeeNumber: entry.employee_number,
    }
    return createLens(snapshot.value, anchor)
  })

  return { snapshot, lens }
}
