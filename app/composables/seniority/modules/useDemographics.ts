import type { QualificationScope } from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

const EMPTY_YOS_DISTRIBUTION = { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 }

/** One line of the Sizes card: pilots in one fleet, seat and base. */
export interface QualificationSizeRow {
  fleet: string
  seat: string
  base: string
  countLabel: string
}

/**
 * Demographics of the pilots in a Qualification Scope (the scenario's, passed in): composition, sizes,
 * age and years-of-service distributions, and Qualification Thresholds for Captains.
 * Works without an Anchor Pilot; the Anchor Pilot's years of service are then undefined.
 */
export function useDemographics(qualificationScope: Ref<QualificationScope>) {
  const { analysis, anchoredAnalysis } = useSeniorityCore()
  const { retirementAge } = useUser()

  const result = computed(() => {
    const currentAnalysis = anchoredAnalysis.value ?? analysis.value
    return currentAnalysis?.demographics({
      mandatoryRetirementAge: retirementAge.value,
      scenario: { qualificationScope: qualificationScope.value },
    }).presentation ?? null
  })

  const qualificationComposition = computed(() => result.value?.qualificationComposition ?? [])
  const matchingPilotCount = computed(() => result.value?.matchingPilotCount ?? 0)
  const qualificationSizes = computed<QualificationSizeRow[]>(() => result.value?.qualificationSizes ?? [])
  const yearsOfServiceBuckets = computed(() => result.value?.yearsOfServiceBuckets ?? [])
  const userYos = computed(() => result.value?.anchorYearsOfService)

  return {
    hasResult: computed(() => result.value !== null),
    qualificationComposition,
    matchingPilotCount,
    qualificationSizes,
    ageDistribution: computed(() => result.value?.ageDistribution ?? { buckets: [], nullCount: 0 }),
    captainQualificationThresholds: computed(() => result.value?.captainQualificationThresholds ?? []),
    yearsOfServiceDistribution: computed(() => result.value?.yearsOfServiceDistribution ?? EMPTY_YOS_DISTRIBUTION),
    yearsOfServiceBuckets,
    hasYearsOfService: computed(() => result.value?.hasYearsOfService ?? false),
    retirementAge,
    userYos,
  }
}
