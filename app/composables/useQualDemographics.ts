import {
  computeAgeDistribution,
  findMostJuniorCA,
  computeQualComposition,
  computeYosDistribution,
  computeYosHistogram,
} from '#shared/utils/qual-analytics'
import type { FilterFn } from '#shared/utils/seniority-math'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

export function useQualDemographics() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  // Selected qual filter state (fleet + seat + optional base)
  const selectedFleet = ref<string | null>(null)
  const selectedSeat = ref<string | null>(null)
  const selectedBase = ref<string | null>(null)

  // Derived from entries
  const availableFleets = computed<string[]>(() => {
    const fleets = new Set<string>()
    for (const e of seniorityStore.entries) {
      if (e.fleet) fleets.add(e.fleet)
    }
    return Array.from(fleets).sort()
  })

  const availableSeats = computed<string[]>(() => {
    const seats = new Set<string>()
    for (const e of seniorityStore.entries) {
      if (e.seat) seats.add(e.seat)
    }
    return Array.from(seats).sort()
  })

  const availableBases = computed<string[]>(() => {
    const bases = new Set<string>()
    for (const e of seniorityStore.entries) {
      if (!e.base) continue
      if (selectedFleet.value && e.fleet !== selectedFleet.value) continue
      if (selectedSeat.value && e.seat !== selectedSeat.value) continue
      bases.add(e.base)
    }
    return Array.from(bases).sort()
  })

  // Filter function for selected qual
  const qualFilterFn = computed<FilterFn>(() => {
    return (e) => {
      if (selectedFleet.value && e.fleet !== selectedFleet.value) return false
      if (selectedSeat.value && e.seat !== selectedSeat.value) return false
      if (selectedBase.value && e.base !== selectedBase.value) return false
      return true
    }
  })

  const mandatoryAge = computed(() => userStore.profile?.mandatory_retirement_age ?? 65)

  // 1.1 Age distribution
  const ageDistribution = computed(() =>
    computeAgeDistribution(seniorityStore.entries, mandatoryAge.value, qualFilterFn.value),
  )

  // 1.2 Most Junior CA — grouped by qual (fleet+seat+base), filtered by current selection
  const mostJuniorCAs = computed(() =>
    findMostJuniorCA(seniorityStore.entries.filter(qualFilterFn.value)),
  )

  // User entry for highlighting "you could hold this"
  const userEntry = computed(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    return seniorityStore.entries.find((e) => e.employee_number === empNum)
  })

  // 1.3 Qual Composition
  const qualComposition = computed(() =>
    computeQualComposition(seniorityStore.entries),
  )

  // YOS distribution
  const yosDistribution = computed(() =>
    computeYosDistribution(seniorityStore.entries, qualFilterFn.value),
  )

  const yosHistogram = computed(() =>
    computeYosHistogram(seniorityStore.entries, qualFilterFn.value),
  )

  return {
    selectedFleet,
    selectedSeat,
    selectedBase,
    availableFleets,
    availableSeats,
    availableBases,
    qualFilterFn,
    ageDistribution,
    mostJuniorCAs,
    userEntry,
    qualComposition,
    yosDistribution,
    yosHistogram,
  }
}
