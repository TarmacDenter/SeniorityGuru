import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'
import type { ComputedRef } from 'vue'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useNewHireMode } from './useNewHireMode'

export function useUserEntry({ withNewHireMode = false } = {}): ComputedRef<SeniorityEntryResponse | undefined> {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()
  const newHireMode = withNewHireMode ? useNewHireMode() : null

  return computed(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    const found = seniorityStore.entries.find((e) => e.employee_number === empNum)
    if (found) return found
    if (newHireMode?.isActive.value && newHireMode.syntheticEntry.value) {
      return newHireMode.syntheticEntry.value
    }
    return undefined
  })
}
