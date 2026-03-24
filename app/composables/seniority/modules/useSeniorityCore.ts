import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { SenioritySnapshot, SeniorityLens, PilotAnchor } from '~/utils/seniority-engine'
import type { ComputedRef, Ref } from 'vue'
import { createSnapshot, createLens } from '~/utils/seniority-engine'
import { uniqueEntryValues } from '~/utils/entry-filters'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { db } from '~/utils/db'

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

    // Async hydration from Dexie preferences
    Promise.all([
      db.preferences.get(PREF_KEY_ENABLED),
      db.preferences.get(PREF_KEY_CONFIG),
    ]).then(([enabledPref, configPref]) => {
      if (enabledPref?.value === 'true') {
        enabled.value = true
      }
      if (configPref?.value) {
        try {
          const parsed = JSON.parse(configPref.value)
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
      // ignore db errors during hydration
    })

    watch(enabled, (val) => {
      db.preferences.put({ key: PREF_KEY_ENABLED, value: String(val) }).catch(() => {})
    })

    watch([birthDate, selectedBase, selectedSeat, selectedFleet], () => {
      db.preferences.put({
        key: PREF_KEY_CONFIG,
        value: JSON.stringify({
          birthDate: birthDate.value,
          selectedBase: selectedBase.value,
          selectedSeat: selectedSeat.value,
          selectedFleet: selectedFleet.value,
        }),
      }).catch(() => {})
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

  // Core engine: user entry lookup
  const userEntry = computed<SeniorityEntry | undefined>(() => {
    const empNum = userStore.employeeNumber
    if (!empNum) return undefined
    return seniorityStore.entries.find(e => e.employee_number === empNum)
  })

  // Effective snapshot: includes synthetic entry when new-hire mode is active
  const baseSnapshot = computed<SenioritySnapshot | null>(() => {
    if (seniorityStore.entries.length === 0) return null
    return createSnapshot([...seniorityStore.entries])
  })

  const snapshot = computed<SenioritySnapshot | null>(() => {
    const synthetic = syntheticEntry.value
    if (!synthetic) return baseSnapshot.value
    if (seniorityStore.entries.length === 0) return null
    return createSnapshot([...seniorityStore.entries, synthetic])
  })

  // Effective lens: re-anchors to synthetic entry when new-hire mode is active
  const baseLens = computed<SeniorityLens | null>(() => {
    if (!baseSnapshot.value) return null
    const entry = userEntry.value
    if (!entry) return null
    const anchor: PilotAnchor = {
      seniorityNumber: entry.seniority_number,
      retireDate: entry.retire_date,
      employeeNumber: entry.employee_number,
    }
    return createLens(baseSnapshot.value, anchor)
  })

  const lens = computed<SeniorityLens | null>(() => {
    const synthetic = syntheticEntry.value
    if (!snapshot.value || !synthetic) return baseLens.value
    const anchor: PilotAnchor = {
      seniorityNumber: synthetic.seniority_number,
      retireDate: synthetic.retire_date,
      employeeNumber: synthetic.employee_number,
    }
    return createLens(snapshot.value, anchor)
  })

  const hasData = computed(() => snapshot.value !== null)
  const hasAnchor = computed(() => lens.value !== null)
  const isNewHireMode = computed(() => enabled.value)

  return { snapshot, lens, userEntry, hasData, hasAnchor, isNewHireMode, newHire }
}
