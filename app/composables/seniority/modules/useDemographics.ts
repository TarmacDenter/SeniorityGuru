import { computeYOS } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'
import { useSeniorityCore } from './useSeniorityCore'
import { useQualificationFilter } from './useQualFilter'

const EMPTY_YOS_DISTRIBUTION = { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 }

/**
 * Demographics of the pilots matching a Qualification filter (fleet, seat, base): composition, sizes,
 * age and years-of-service distributions, and Qualification Thresholds for Captains.
 * The filter is local to the Qualifications panel's demographics section.
 */
export function useDemographics() {
  const { analysis, anchoredAnalysis, newHire, userEntry } = useSeniorityCore()
  const { retirementAge } = useUser()
  const filter = useQualificationFilter()

  const result = computed(() => {
    const currentAnalysis = anchoredAnalysis.value ?? analysis.value
    return currentAnalysis?.demographics({
      mandatoryRetirementAge: retirementAge.value,
      scenario: { qualificationScope: filter.qualificationScope.value },
    }).presentation ?? null
  })

  const qualificationComposition = computed(() => result.value?.qualificationComposition ?? [])
  const matchingPilotCount = computed(() => qualificationComposition.value.reduce((total, row) => total + row.total, 0))
  const userYos = computed(() => {
    const entry = newHire.syntheticEntry.value ?? userEntry.value
    return entry ? computeYOS(entry.hire_date, todayPlainDate()) : undefined
  })

  return {
    filter,
    qualificationLabel: filter.qualificationLabel,
    hasResult: computed(() => result.value !== null),
    qualificationComposition,
    matchingPilotCount,
    ageDistribution: computed(() => result.value?.ageDistribution ?? { buckets: [], nullCount: 0 }),
    captainQualificationThresholds: computed(() => result.value?.captainQualificationThresholds ?? []),
    yearsOfServiceDistribution: computed(() => result.value?.yearsOfServiceDistribution ?? EMPTY_YOS_DISTRIBUTION),
    yearsOfServiceBuckets: computed(() => result.value?.yearsOfServiceBuckets ?? []),
    retirementAge,
    userYos,
  }
}
