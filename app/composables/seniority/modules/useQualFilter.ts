import type { QualificationScope } from '~/utils/seniority'
import { formatQualificationScope, getSeniorityEntryValues } from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

export function useQualFilter() {
  const { entries, snapshot } = useSeniorityCore()

  const selectedFleet = ref<string | null>(null)
  const selectedSeat = ref<string | null>(null)
  const selectedBase = ref<string | null>(null)

  const availableFleets = computed(() => [...(snapshot.value?.fleets ?? [])])
  const availableSeats = computed(() => [...(snapshot.value?.seats ?? [])])
  const availableBases = computed(() => {
    const matchingEntries = entries.value.filter((entry) => {
      if (selectedFleet.value && entry.fleet !== selectedFleet.value) return false
      if (selectedSeat.value && entry.seat !== selectedSeat.value) return false
      return true
    })
    return [...getSeniorityEntryValues(matchingEntries, 'base')]
  })

  const qualificationScope = computed<QualificationScope>(() => ({
    ...(selectedFleet.value && { fleet: selectedFleet.value }),
    ...(selectedSeat.value && { seat: selectedSeat.value }),
    ...(selectedBase.value && { base: selectedBase.value }),
  }))

  const qualificationLabel = computed(() => {
    const label = formatQualificationScope(qualificationScope.value)
    return label === 'Company-wide' ? '' : label
  })

  watch(availableFleets, (fleets) => {
    if (selectedFleet.value && !fleets.includes(selectedFleet.value)) selectedFleet.value = null
  })
  watch(availableSeats, (seats) => {
    if (selectedSeat.value && !seats.includes(selectedSeat.value)) selectedSeat.value = null
  })
  watch(availableBases, (bases) => {
    if (selectedBase.value && !bases.includes(selectedBase.value)) selectedBase.value = null
  })

  function clear() {
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
    qualificationScope,
    qualificationLabel,
    clear,
  }
}
