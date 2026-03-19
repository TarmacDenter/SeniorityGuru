import { createLens, createScenario, qualSpecLabel } from '#shared/utils/seniority-engine'
import type { QualSpec } from '#shared/utils/seniority-engine'
import { uniqueEntryValues } from '#shared/utils/entry-filters'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useUserEntry } from './useUserEntry'
// Intentionally uses the base engine — demographics reflect the real pilot population,
// not the synthetic new-hire entry. Callers needing user-specific markers (YOS, holdable)
// must fall back to newHireMode.syntheticEntry at the call site.
import { useSeniorityEngine } from './useSeniorityEngine'

export function useQualDemographics() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()
  const userEntry = useUserEntry()
  const { snapshot, lens } = useSeniorityEngine()

  const selectedFleet = ref<string | null>(null)
  const selectedSeat = ref<string | null>(null)
  const selectedBase = ref<string | null>(null)

  const availableFleets = computed(() => snapshot.value?.uniqueFleets ?? [])
  const availableSeats = computed(() => snapshot.value?.uniqueSeats ?? [])
  const availableBases = computed(() => {
    // Bases are filtered by selected fleet/seat — can't use snapshot directly
    const filtered = seniorityStore.entries.filter((e) => {
      if (selectedFleet.value && e.fleet !== selectedFleet.value) return false
      if (selectedSeat.value && e.seat !== selectedSeat.value) return false
      return true
    })
    return uniqueEntryValues(filtered, 'base')
  })

  const qualSpec = computed<QualSpec>(() => {
    const spec: { fleet?: string; seat?: string; base?: string } = {}
    if (selectedFleet.value) spec.fleet = selectedFleet.value
    if (selectedSeat.value) spec.seat = selectedSeat.value
    if (selectedBase.value) spec.base = selectedBase.value
    return spec
  })

  const mandatoryAge = computed(() => userStore.profile?.mandatory_retirement_age ?? 65)

  const scenario = computed(() => createScenario({ scopeFilter: qualSpec.value }))

  // Demographics doesn't need an anchor — use anchored lens if available,
  // fall back to anchor-less lens for demographic-only queries
  const demographicsResult = computed(() => {
    if (!snapshot.value) return null
    const l = lens.value ?? createLens(snapshot.value)
    return l.demographics(mandatoryAge.value, scenario.value)
  })

  const ageDistribution = computed(() =>
    demographicsResult.value?.ageDistribution ?? { buckets: [], nullCount: 0 },
  )

  const mostJuniorCAs = computed(() =>
    demographicsResult.value?.mostJuniorCAs ?? [],
  )

  const qualComposition = computed(() =>
    demographicsResult.value?.qualComposition ?? [],
  )

  const yosDistribution = computed(() =>
    demographicsResult.value?.yosDistribution
    ?? { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 },
  )

  const yosHistogram = computed(() =>
    demographicsResult.value?.yosHistogram ?? [],
  )

  const qualLabel = computed(() => {
    const label = qualSpecLabel(qualSpec.value)
    return label === 'Company-wide' ? '' : label
  })

  // Auto-clear stale selections when the active list changes
  watch(availableFleets, (fleets) => {
    if (selectedFleet.value && !fleets.includes(selectedFleet.value))
      selectedFleet.value = null
  })
  watch(availableSeats, (seats) => {
    if (selectedSeat.value && !seats.includes(selectedSeat.value))
      selectedSeat.value = null
  })
  watch(availableBases, (bases) => {
    if (selectedBase.value && !bases.includes(selectedBase.value))
      selectedBase.value = null
  })

  function clearFilter() {
    selectedFleet.value = null
    selectedSeat.value = null
    selectedBase.value = null
  }

  return {
    selectedFleet,
    selectedSeat,
    selectedBase,
    availableFleets,
    availableSeats,
    availableBases,
    qualSpec,
    qualLabel,
    clearFilter,
    ageDistribution,
    mostJuniorCAs,
    userEntry,
    qualComposition,
    yosDistribution,
    yosHistogram,
  }
}
