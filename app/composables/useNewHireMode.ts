import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import { uniqueEntryValues } from '#shared/utils/entry-filters'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

const STORAGE_KEY = 'seniority-guru-new-hire-mode'
const STORAGE_KEY_CONFIG = 'seniority-guru-new-hire-config'

const enabled = ref(false)
const selectedBase = ref<string | null>(null)
const selectedSeat = ref<string | null>(null)
const selectedFleet = ref<string | null>(null)
const birthDate = ref<string | null>(null)

let _localStorageInitialized = false

export function useNewHireMode() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  if (!_localStorageInitialized && import.meta.client && typeof localStorage !== 'undefined') {
    _localStorageInitialized = true
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      enabled.value = true
    }
    const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        if (parsed.birthDate) birthDate.value = parsed.birthDate
        if (parsed.selectedBase) selectedBase.value = parsed.selectedBase
        if (parsed.selectedSeat) selectedSeat.value = parsed.selectedSeat
        if (parsed.selectedFleet) selectedFleet.value = parsed.selectedFleet
      }
      catch {
        // ignore invalid JSON
      }
    }
    watch(enabled, (val) => {
      localStorage.setItem(STORAGE_KEY, String(val))
    })
    watch([birthDate, selectedBase, selectedSeat, selectedFleet], () => {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
        birthDate: birthDate.value,
        selectedBase: selectedBase.value,
        selectedSeat: selectedSeat.value,
        selectedFleet: selectedFleet.value,
      }))
    })
  }

  const availableBases = computed(() => uniqueEntryValues(seniorityStore.entries, 'base'))
  const availableSeats = computed(() => uniqueEntryValues(seniorityStore.entries, 'seat'))
  const availableFleets = computed(() => uniqueEntryValues(seniorityStore.entries, 'fleet'))

  const realUserFound = computed(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return false
    return seniorityStore.entries.some((e) => e.employee_number === empNum)
  })

  const isActive = computed(() => enabled.value && !realUserFound.value)

  const retireDate = computed(() => {
    if (!birthDate.value) return null
    const bd = new Date(birthDate.value)
    const retire = new Date(bd)
    retire.setFullYear(retire.getFullYear() + 65)
    return retire.toISOString().split('T')[0]!
  })

  const isConfigured = computed(() =>
    selectedBase.value !== null
    && selectedSeat.value !== null
    && selectedFleet.value !== null
    && birthDate.value !== null,
  )

  const syntheticEntry = computed<SeniorityEntry | null>(() => {
    if (!isActive.value) return null
    if (!isConfigured.value) return null
    const empNum = userStore.profile?.employee_number
    if (!empNum) return null
    const maxSenNum = seniorityStore.entries.reduce(
      (max, e) => Math.max(max, e.seniority_number),
      0,
    )
    return {
      seniority_number: maxSenNum + 1,
      employee_number: empNum,
      name: 'You (New Hire)',
      seat: selectedSeat.value!,
      base: selectedBase.value!,
      fleet: selectedFleet.value!,
      hire_date: new Date().toISOString().split('T')[0]!,
      retire_date: retireDate.value!,
    }
  })

  return {
    enabled,
    selectedBase,
    selectedSeat,
    selectedFleet,
    birthDate,
    availableBases,
    availableSeats,
    availableFleets,
    realUserFound,
    isActive,
    isConfigured,
    retireDate,
    syntheticEntry,
  }
}
