import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'
import type { ComputedRef } from 'vue'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

export function useUserEntry(): ComputedRef<SeniorityEntryResponse | undefined> {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()
  return computed(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    return seniorityStore.entries.find((e) => e.employee_number === empNum)
  })
}
