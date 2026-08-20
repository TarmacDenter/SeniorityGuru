import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { AnchoredSeniorityLens, SeniorityLens, SenioritySnapshot } from '~/utils/seniority-engine'
import type { ComputedRef, Ref } from 'vue'
import { createSnapshot, createLens, uniqueEntryValues } from '~/utils/seniority-engine'
import { computeRetireDateValue } from '~/utils/date'
import { parsePlainDate, serializePlainDate, todayPlainDate, type PlainDate } from '~/utils/temporal'
import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { createLogger } from '~/utils/logger'

const log = createLogger('seniority-core')

export interface NewHireControls {
  enabled: Ref<boolean>
  selectedBase: Ref<string | null>
  selectedSeat: Ref<string | null>
  selectedFleet: Ref<string | null>
  birthDate: Ref<PlainDate | null>
  availableBases: ComputedRef<string[]>
  availableSeats: ComputedRef<string[]>
  availableFleets: ComputedRef<string[]>
  realUserFound: ComputedRef<boolean>
  isConfigured: ComputedRef<boolean>
  retireDate: ComputedRef<PlainDate | null>
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
const birthDate = shallowRef<PlainDate | null>(null)

let _dbInitialized = false

// Lazy singleton computeds — created once on first call, shared by all callers.
// Prevents re-evaluating createSnapshot(17k entries) on every tab switch.
let _userEntry: ComputedRef<SeniorityEntry | undefined> | null = null
let _baseSnapshot: ComputedRef<SenioritySnapshot | null> | null = null
let _snapshot: ComputedRef<SenioritySnapshot | null> | null = null
let _lens: ComputedRef<SeniorityLens | null> | null = null
let _anchoredLens: ComputedRef<AnchoredSeniorityLens | null> | null = null

/** Reset singleton computeds. Called by tests that create fresh Pinia instances. */
export function _resetCoreSingletons() {
  _userEntry = null
  _baseSnapshot = null
  _snapshot = null
  _lens = null
  _anchoredLens = null
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
        if (configVal.birthDate) birthDate.value = parsePlainDate(configVal.birthDate)
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
        birthDate: birthDate.value ? serializePlainDate(birthDate.value) : null,
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
    const normalized = normalizeEmployeeNumber(empNum)
    return seniorityStore.entries.some(e => normalizeEmployeeNumber(e.employee_number) === normalized)
  })

  const retireDate = computed(() => {
    if (!birthDate.value) return null
    const dob = typeof birthDate.value === 'string' ? parsePlainDate(birthDate.value) : birthDate.value
    return dob ? computeRetireDateValue(dob, userStore.retirementAge) : null
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
      hire_date: todayPlainDate(),
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
      const normalized = normalizeEmployeeNumber(empNum)
      return seniorityStore.entries.find(e => normalizeEmployeeNumber(e.employee_number) === normalized)
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

  if (!_lens) {
    _lens = computed<SeniorityLens | null>(() => {
      if (!_snapshot!.value) return null
      return createLens(_snapshot!.value, { asOfDate: todayPlainDate() })
    })
  }

  if (!_anchoredLens) {
    _anchoredLens = computed<AnchoredSeniorityLens | null>(() => {
      const currentLens = _lens!.value
      if (!currentLens) return null
      const synthetic = syntheticEntry.value
      const entry = synthetic ?? _userEntry!.value
      if (!entry) return null
      return currentLens.withAnchor(entry.employee_number)
    })
  }

  const userEntry = _userEntry
  const snapshot = _snapshot
  const lens = _lens
  const anchoredLens = _anchoredLens

  const hasData = computed(() => lens.value !== null)
  const hasAnchor = computed(() => anchoredLens.value !== null)
  const isNewHireMode = computed(() => enabled.value)

  const entries = computed(() => seniorityStore.entries)

  return { snapshot, lens, anchoredLens, userEntry, entries, hasData, hasAnchor, isNewHireMode, newHire }
}
