import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'
import { uniqueEntryValues } from '#shared/utils/entry-filters'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

const STORAGE_KEY = 'seniority-guru-new-hire-mode'

export function useNewHireMode() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  const enabled = ref(false)

  if (import.meta.client && typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true') {
    enabled.value = true
  }

  watch(enabled, (val) => {
    if (import.meta.client && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(val))
    }
  })

  const selectedBase = ref<string | null>(null)
  const selectedSeat = ref<string | null>(null)
  const selectedFleet = ref<string | null>(null)

  const availableBases = computed(() => uniqueEntryValues(seniorityStore.entries, 'base'))
  const availableSeats = computed(() => uniqueEntryValues(seniorityStore.entries, 'seat'))
  const availableFleets = computed(() => uniqueEntryValues(seniorityStore.entries, 'fleet'))

  const realUserFound = computed(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return false
    return seniorityStore.entries.some((e) => e.employee_number === empNum)
  })

  const isActive = computed(() => enabled.value && !realUserFound.value)

  const syntheticEntry = computed<SeniorityEntryResponse | null>(() => {
    if (!isActive.value) return null
    const empNum = userStore.profile?.employee_number
    if (!empNum) return null
    const maxSenNum = seniorityStore.entries.reduce(
      (max, e) => Math.max(max, e.seniority_number),
      0,
    )
    return {
      id: 'synthetic-new-hire',
      list_id: seniorityStore.currentListId ?? '',
      seniority_number: maxSenNum + 1,
      employee_number: empNum,
      name: 'You (New Hire)',
      seat: selectedSeat.value,
      base: selectedBase.value,
      fleet: selectedFleet.value,
      hire_date: new Date().toISOString().split('T')[0]!,
      retire_date: null,
    }
  })

  return {
    enabled,
    selectedBase,
    selectedSeat,
    selectedFleet,
    availableBases,
    availableSeats,
    availableFleets,
    realUserFound,
    isActive,
    syntheticEntry,
  }
}
