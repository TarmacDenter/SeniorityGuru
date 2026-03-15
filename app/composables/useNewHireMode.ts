import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

const STORAGE_KEY = 'seniority-guru-new-hire-mode'

export function useNewHireMode() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  const enabled = ref(false)

  // Initialize from localStorage
  if (import.meta.client && typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true') {
    enabled.value = true
  }

  // Persist to localStorage
  watch(enabled, (val) => {
    if (import.meta.client && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(val))
    }
  })

  const selectedBase = ref<string | null>(null)
  const selectedSeat = ref<string | null>(null)
  const selectedFleet = ref<string | null>(null)

  const availableBases = computed(() => {
    const bases = new Set<string>()
    for (const e of seniorityStore.entries) {
      if (e.base) bases.add(e.base)
    }
    return Array.from(bases).sort()
  })

  const availableSeats = computed(() => {
    const seats = new Set<string>()
    for (const e of seniorityStore.entries) {
      if (e.seat) seats.add(e.seat)
    }
    return Array.from(seats).sort()
  })

  const availableFleets = computed(() => {
    const fleets = new Set<string>()
    for (const e of seniorityStore.entries) {
      if (e.fleet) fleets.add(e.fleet)
    }
    return Array.from(fleets).sort()
  })

  // Check if the real user is found in the list
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
