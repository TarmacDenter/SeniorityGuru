import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { SenioritySnapshot, SeniorityLens, PilotAnchor } from '~/utils/seniority-engine'
import type { ComputedRef, Ref } from 'vue'
import { createSnapshot, createLens } from '~/utils/seniority-engine'
import { uniqueEntryValues } from '~/utils/entry-filters'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

export interface NewHireControls {
  enabled: Ref<boolean>
  selectedBase: Ref<string | null>
  selectedSeat: Ref<string | null>
  selectedFleet: Ref<string | null>
  birthDate: Ref<string | null>
  availableBases: ComputedRef<string[]>
  availableSeats: ComputedRef<string[]>
  availableFleets: ComputedRef<string[]>
  realUserFound: ComputedRef<boolean>
  isConfigured: ComputedRef<boolean>
  retireDate: ComputedRef<string | null>
  syntheticEntry: ComputedRef<SeniorityEntry | null>
  reset(): void
}

const PREF_KEY_ENABLED = 'newHireEnabled'
const PREF_KEY_CONFIG = 'growthConfig'

// Module-level singleton refs — shared across all callers
const enabled = ref(false)
const selectedBase = ref<string | null>(null)
const selectedSeat = ref<string | null>(null)
const selectedFleet = ref<string | null>(null)
const birthDate = ref<string | null>(null)

let _dbInitialized = false

// Lazy singleton computeds — created once on first call, shared by all callers.
// Prevents re-evaluating createSnapshot(17k entries) on every tab switch.
let _userEntry: ComputedRef<SeniorityEntry | undefined> | null = null
let _baseSnapshot: ComputedRef<SenioritySnapshot | null> | null = null
let _snapshot: ComputedRef<SenioritySnapshot | null> | null = null
let _baseLens: ComputedRef<SeniorityLens | null> | null = null
let _lens: ComputedRef<SeniorityLens | null> | null = null

/** Reset singleton computeds. Called by tests that create fresh Pinia instances. */
export function _resetCoreSingletons() {
  _userEntry = null
  _baseSnapshot = null
  _snapshot = null
  _baseLens = null
  _lens = null
  _dbInitialized = false
}

export function useSeniorityCore() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  // Dexie preferences persistence (client-only, one-time init)
  if (!_dbInitialized && import.meta.client) {
    _dbInitialized = true

    watch(
      () => userStore.employeeNumber,
      (newVal, oldVal) => {
        if (oldVal != null && newVal !== oldVal) reset()
      },
    )

    // Async hydration from preferences via user store
    Promise.all([
      userStore.getPreference(PREF_KEY_ENABLED),
      userStore.getPreference(PREF_KEY_CONFIG),
    ]).then(([enabledVal, configVal]) => {
      if (enabledVal === 'true') {
        enabled.value = true
      }
      if (configVal) {
        try {
          const parsed = JSON.parse(configVal)
          if (parsed.birthDate) birthDate.value = parsed.birthDate
          if (parsed.selectedBase) selectedBase.value = parsed.selectedBase
          if (parsed.selectedSeat) selectedSeat.value = parsed.selectedSeat
          if (parsed.selectedFleet) selectedFleet.value = parsed.selectedFleet
        }
        catch {
          // ignore invalid JSON
        }
      }
    }).catch(() => {
      // ignore errors during hydration
    })

    watch(enabled, (val) => {
      userStore.savePreference(PREF_KEY_ENABLED, String(val)).catch(() => {})
    })

    watch([birthDate, selectedBase, selectedSeat, selectedFleet], () => {
      userStore.savePreference(PREF_KEY_CONFIG, JSON.stringify({
        birthDate: birthDate.value,
        selectedBase: selectedBase.value,
        selectedSeat: selectedSeat.value,
        selectedFleet: selectedFleet.value,
      })).catch(() => {})
    })
  }

  // New-hire computed helpers
  const availableBases = computed(() => uniqueEntryValues(seniorityStore.entries, 'base'))
  const availableSeats = computed(() => uniqueEntryValues(seniorityStore.entries, 'seat'))
  const availableFleets = computed(() => uniqueEntryValues(seniorityStore.entries, 'fleet'))

  const realUserFound = computed(() => {
    const empNum = userStore.employeeNumber
    if (!empNum) return false
    return seniorityStore.entries.some(e => e.employee_number === empNum)
  })

  const retireDate = computed(() => {
    if (!birthDate.value) return null
    const bd = new Date(birthDate.value)
    const retire = new Date(bd)
    const retirementAge = userStore.retirementAge
    retire.setFullYear(retire.getFullYear() + retirementAge)
    return retire.toISOString().split('T')[0]!
  })

  const isConfigured = computed(() =>
    selectedBase.value !== null
    && selectedSeat.value !== null
    && selectedFleet.value !== null
    && birthDate.value !== null,
  )

  const syntheticEntry = computed<SeniorityEntry | null>(() => {
    if (!enabled.value) return null
    if (!isConfigured.value) return null
    const maxSenNum = seniorityStore.entries.reduce(
      (max, e) => Math.max(max, e.seniority_number),
      0,
    )
    return {
      seniority_number: maxSenNum + 1,
      employee_number: '_new_hire',
      name: 'You (New Hire)',
      seat: selectedSeat.value!,
      base: selectedBase.value!,
      fleet: selectedFleet.value!,
      hire_date: new Date().toISOString().split('T')[0]!,
      retire_date: retireDate.value!,
    }
  })

  function reset() {
    enabled.value = false
    selectedBase.value = null
    selectedSeat.value = null
    selectedFleet.value = null
    birthDate.value = null
  }

  const newHire: NewHireControls = {
    enabled,
    selectedBase,
    selectedSeat,
    selectedFleet,
    birthDate,
    availableBases,
    availableSeats,
    availableFleets,
    realUserFound,
    isConfigured,
    retireDate,
    syntheticEntry,
    reset,
  }

  // Lazy singleton computeds — created once, reused by all callers.
  // This avoids re-evaluating createSnapshot(17k entries) on every tab switch.
  if (!_userEntry) {
    _userEntry = computed<SeniorityEntry | undefined>(() => {
      const empNum = userStore.employeeNumber
      if (!empNum) return undefined
      return seniorityStore.entries.find(e => e.employee_number === empNum)
    })
  }

  if (!_baseSnapshot) {
    _baseSnapshot = computed<SenioritySnapshot | null>(() => {
      if (seniorityStore.entries.length === 0) return null
      return createSnapshot([...seniorityStore.entries])
    })
  }

  if (!_snapshot) {
    _snapshot = computed<SenioritySnapshot | null>(() => {
      const synthetic = syntheticEntry.value
      if (!synthetic) return _baseSnapshot!.value
      if (seniorityStore.entries.length === 0) return null
      return createSnapshot([...seniorityStore.entries, synthetic])
    })
  }

  if (!_baseLens) {
    _baseLens = computed<SeniorityLens | null>(() => {
      if (!_baseSnapshot!.value) return null
      const entry = _userEntry!.value
      if (!entry) return null
      const anchor: PilotAnchor = {
        seniorityNumber: entry.seniority_number,
        retireDate: entry.retire_date,
        employeeNumber: entry.employee_number,
      }
      return createLens(_baseSnapshot!.value, anchor)
    })
  }

  if (!_lens) {
    _lens = computed<SeniorityLens | null>(() => {
      const synthetic = syntheticEntry.value
      if (!_snapshot!.value || !synthetic) return _baseLens!.value
      const anchor: PilotAnchor = {
        seniorityNumber: synthetic.seniority_number,
        retireDate: synthetic.retire_date,
        employeeNumber: synthetic.employee_number,
      }
      return createLens(_snapshot!.value, anchor)
    })
  }

  const userEntry = _userEntry
  const snapshot = _snapshot
  const lens = _lens

  const hasData = computed(() => snapshot.value !== null)
  const hasAnchor = computed(() => lens.value !== null)
  const isNewHireMode = computed(() => enabled.value)

  const entries = computed(() => seniorityStore.entries)

  return { snapshot, lens, userEntry, entries, hasData, hasAnchor, isNewHireMode, newHire }
}
