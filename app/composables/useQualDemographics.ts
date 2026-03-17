import {
  computeAgeDistribution,
  findMostJuniorCA,
  computeQualComposition,
  computeYosDistribution,
  computeYosHistogram,
} from '#shared/utils/qual-analytics'
import { uniqueEntryValues } from '#shared/utils/entry-filters'
import type { FilterFn } from '#shared/utils/seniority-math'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useUserEntry } from './useUserEntry'

export function useQualDemographics() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()
  const userEntry = useUserEntry()

  const selectedFleet = ref<string | null>(null)
  const selectedSeat = ref<string | null>(null)
  const selectedBase = ref<string | null>(null)

  const availableFleets = computed(() => uniqueEntryValues(seniorityStore.entries, 'fleet'))
  const availableSeats = computed(() => uniqueEntryValues(seniorityStore.entries, 'seat'))
  const availableBases = computed(() => {
    const filtered = seniorityStore.entries.filter((e) => {
      if (selectedFleet.value && e.fleet !== selectedFleet.value) return false
      if (selectedSeat.value && e.seat !== selectedSeat.value) return false
      return true
    })
    return uniqueEntryValues(filtered, 'base')
  })

  const qualFilterFn = computed<FilterFn>(() => {
    return (e) => {
      if (selectedFleet.value && e.fleet !== selectedFleet.value) return false
      if (selectedSeat.value && e.seat !== selectedSeat.value) return false
      if (selectedBase.value && e.base !== selectedBase.value) return false
      return true
    }
  })

  const mandatoryAge = computed(() => userStore.profile?.mandatory_retirement_age ?? 65)

  const ageDistribution = computed(() =>
    computeAgeDistribution(seniorityStore.entries, mandatoryAge.value, qualFilterFn.value),
  )

  const mostJuniorCAs = computed(() =>
    findMostJuniorCA(seniorityStore.entries.filter(qualFilterFn.value)),
  )

  const qualComposition = computed(() =>
    computeQualComposition(seniorityStore.entries),
  )

  const yosDistribution = computed(() =>
    computeYosDistribution(seniorityStore.entries, qualFilterFn.value),
  )

  const yosHistogram = computed(() =>
    computeYosHistogram(seniorityStore.entries, qualFilterFn.value),
  )

  const qualLabel = computed(() => {
    const parts: string[] = []
    if (selectedFleet.value) parts.push(selectedFleet.value)
    if (selectedSeat.value) parts.push(selectedSeat.value)
    if (selectedBase.value) parts.push(selectedBase.value)
    return parts.join(' ')
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
    qualFilterFn,
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
