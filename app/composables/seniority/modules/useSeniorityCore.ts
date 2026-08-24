import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { AnchoredSeniorityAnalysis, SeniorityAnalysis } from '~/utils/seniority'
import type { ComputedRef, Ref } from 'vue'
import { createSeniorityAnalysis } from '~/utils/seniority'
import { computeRetireDateValue } from '~/utils/date'
import { parsePlainDate, serializePlainDate, todayPlainDate, Temporal, type PlainDate } from '~/utils/temporal'
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
// Prevents rebuilding the Seniority Analysis indexes for 17k entries on every tab switch.
let _userEntry: ComputedRef<SeniorityEntry | undefined> | null = null
let _baseAnalysis: ComputedRef<SeniorityAnalysis | null> | null = null
let _analysis: ComputedRef<SeniorityAnalysis | null> | null = null
let _anchoredAnalysis: ComputedRef<AnchoredSeniorityAnalysis | null> | null = null

/** Reset singleton computeds. Called by tests that create fresh Pinia instances. */
export function _resetCoreSingletons() {
  _userEntry = null
  _baseAnalysis = null
  _analysis = null
  _anchoredAnalysis = null
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
        log.error('Failed to persist new-hire configuration preference', { error: String(e) })
      })
    })
  }

  // New-hire computed helpers
  const availableBases = computed(() => [...(_baseAnalysis?.value?.catalog.bases ?? [])])
  const availableSeats = computed(() => [...(_baseAnalysis?.value?.catalog.seats ?? [])])
  const availableFleets = computed(() => [...(_baseAnalysis?.value?.catalog.fleets ?? [])])

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
  // This avoids rebuilding the Seniority Analysis indexes for 17k entries on every tab switch.
  if (!_userEntry) {
    _userEntry = computed<SeniorityEntry | undefined>(() => {
      const empNum = userStore.employeeNumber
      if (!empNum) return undefined
      const normalized = normalizeEmployeeNumber(empNum)
      return seniorityStore.entries.find(e => normalizeEmployeeNumber(e.employee_number) === normalized)
    })
  }

  if (!_baseAnalysis) {
    _baseAnalysis = computed<SeniorityAnalysis | null>(() => {
      if (seniorityStore.entries.length === 0) return null
      return createSeniorityAnalysis({
        entries: seniorityStore.entries,
        asOfDate: todayPlainDate(),
      })
    })
  }

  if (!_analysis) {
    _analysis = computed<SeniorityAnalysis | null>(() => {
      const synthetic = syntheticEntry.value
      if (!synthetic) return _baseAnalysis!.value
      if (seniorityStore.entries.length === 0) return null
      return createSeniorityAnalysis({
        entries: [...seniorityStore.entries, synthetic],
        asOfDate: todayPlainDate(),
      })
    })
  }

  if (!_anchoredAnalysis) {
    _anchoredAnalysis = computed<AnchoredSeniorityAnalysis | null>(() => {
      const currentAnalysis = _analysis!.value
      if (!currentAnalysis) return null
      const synthetic = syntheticEntry.value
      const entry = synthetic ?? _userEntry!.value
      if (!entry) return null
      return currentAnalysis.withAnchor(entry.employee_number)
    })
  }

  const userEntry = _userEntry
  const listAnalysis = _baseAnalysis
  const analysis = _analysis
  const anchoredAnalysis = _anchoredAnalysis

  const hasData = computed(() => analysis.value !== null)
  const hasAnchor = computed(() => anchoredAnalysis.value !== null)
  const isNewHireMode = computed(() => enabled.value)

  const entries = computed(() => seniorityStore.entries)
  const projectionEndDate = computed<PlainDate | null>(() => {
    const userRetireDate = syntheticEntry.value?.retire_date ?? _userEntry!.value?.retire_date
    if (userRetireDate) return userRetireDate

    return seniorityStore.entries.reduce<PlainDate | null>((latest, entry) => {
      if (!entry.retire_date) return latest
      if (!latest || Temporal.PlainDate.compare(entry.retire_date, latest) > 0) return entry.retire_date
      return latest
    }, null)
  })

  return { listAnalysis, analysis, anchoredAnalysis, userEntry, entries, projectionEndDate, hasData, hasAnchor, isNewHireMode, newHire }
}
