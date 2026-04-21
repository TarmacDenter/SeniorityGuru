import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { SenioritySnapshot, SeniorityLens, PilotAnchor } from '~/utils/seniority-engine'
import type { ComputedRef, Ref } from 'vue'
import { createSnapshot, createLens, uniqueEntryValues } from '~/utils/seniority-engine'
import { computeRetireDate, todayISO } from '~/utils/date'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { createLogger } from '~/utils/logger'
import { canonicalizeEmployeeNumber } from '~/utils/schemas/seniority-list'

const log = createLogger('seniority-core')

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
      if (enabledVal) enabled.value = enabledVal
      if (configVal) {
        if (configVal.birthDate) birthDate.value = configVal.birthDate
        if (configVal.selectedBase) selectedBase.value = configVal.selectedBase
        if (configVal.selectedSeat) selectedSeat.value = configVal.selectedSeat
        if (configVal.selectedFleet) selectedFleet.value = configVal.selectedFleet
      }
      log.debug('New-hire preferences hydrated', {
        enabled: enabled.value,
        selectedBase: selectedBase.value,
        selectedSeat: selectedSeat.value,
        selectedFleet: selectedFleet.value,
        hasBirthDate: birthDate.value !== null,
      })
    }).catch((e: unknown) => {
      log.warn('Failed to hydrate new-hire preferences', { error: String(e) })
    })

    watch(enabled, (val) => {
      log.info('New-hire mode toggled', { enabled: val })
      userStore.savePreference(PREF_KEY_ENABLED, val).catch((e: unknown) => {
        log.error('Failed to persist newHireEnabled preference', { error: String(e) })
      })
    })

    watch([birthDate, selectedBase, selectedSeat, selectedFleet], () => {
      userStore.savePreference(PREF_KEY_CONFIG, {
        birthDate: birthDate.value,
        selectedBase: selectedBase.value,
        selectedSeat: selectedSeat.value,
        selectedFleet: selectedFleet.value,
      }).catch((e: unknown) => {
        log.error('Failed to persist growthConfig preference', { error: String(e) })
      })
    })
  }

  // New-hire computed helpers
  const availableBases = computed(() => uniqueEntryValues(seniorityStore.entries, 'base'))
  const availableSeats = computed(() => uniqueEntryValues(seniorityStore.entries, 'seat'))
  const availableFleets = computed(() => uniqueEntryValues(seniorityStore.entries, 'fleet'))

  const realUserFound = computed(() => {
    const empNum = userStore.employeeNumber
    if (!empNum) return false
    const canonicalEmpNum = canonicalizeEmployeeNumber(empNum)
    return seniorityStore.entries.some(e => canonicalizeEmployeeNumber(e.employee_number) === canonicalEmpNum)
  })

  const retireDate = computed(() => {
    if (!birthDate.value) return null
    return computeRetireDate(birthDate.value, userStore.retirementAge)
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
      hire_date: todayISO(),
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
      const canonicalEmpNum = canonicalizeEmployeeNumber(empNum)
      return seniorityStore.entries.find(e => canonicalizeEmployeeNumber(e.employee_number) === canonicalEmpNum)
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
