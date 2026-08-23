import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { QualificationScope } from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

function entryValues(
  entries: readonly SeniorityEntry[],
  field: 'base' | 'seat' | 'fleet',
): string[] {
  return [...new Set(entries.map(entry => entry[field]).filter(Boolean))].sort()
}

export function useQualificationFilter() {
  const { entries, listAnalysis } = useSeniorityCore()

  const selectedFleet = ref<string | null>(null)
  const selectedSeat = ref<string | null>(null)
  const selectedBase = ref<string | null>(null)

  const scopeOptions = computed(() => listAnalysis.value?.catalog.qualificationScopeOptions ?? [])
  const availableFleets = computed(() => [...(listAnalysis.value?.catalog.fleets ?? [])])
  const availableSeats = computed(() => [...(listAnalysis.value?.catalog.seats ?? [])])
  const availableBases = computed(() => {
    const matchingEntries = entries.value.filter((entry) => {
      if (selectedFleet.value && entry.fleet !== selectedFleet.value) return false
      if (selectedSeat.value && entry.seat !== selectedSeat.value) return false
      return true
    })
    return entryValues(matchingEntries, 'base')
  })

  const qualificationScope = computed<QualificationScope>(() => ({
    ...(selectedFleet.value && { fleet: selectedFleet.value }),
    ...(selectedSeat.value && { seat: selectedSeat.value }),
    ...(selectedBase.value && { base: selectedBase.value }),
  }))

  const qualificationLabel = computed(() => {
    const scope = qualificationScope.value
    const label = scopeOptions.value.find(option =>
      option.scope.base === scope.base
      && option.scope.seat === scope.seat
      && option.scope.fleet === scope.fleet,
    )?.label ?? ''
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
