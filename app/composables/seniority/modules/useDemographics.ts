import type { QualificationScope } from '~/utils/seniority'
import { computeYOS } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'
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
  const { analysis, anchoredAnalysis, newHire, userEntry } = useSeniorityCore()
  const { retirementAge } = useUser()

  const result = computed(() => {
    const currentAnalysis = anchoredAnalysis.value ?? analysis.value
    return currentAnalysis?.demographics({
      mandatoryRetirementAge: retirementAge.value,
      scenario: { qualificationScope: qualificationScope.value },
    }).presentation ?? null
  })

  const qualificationComposition = computed(() => result.value?.qualificationComposition ?? [])
  const matchingPilotCount = computed(() => qualificationComposition.value.reduce((total, row) => total + row.total, 0))
  const qualificationSizes = computed<QualificationSizeRow[]>(() => qualificationComposition.value
    .flatMap(qual => (qual.byBase?.length ? qual.byBase : [{ base: '—', count: qual.total }])
      .map(({ base, count }) => ({ fleet: qual.fleet, seat: qual.seat, base, count })))
    .sort((a, b) => a.seat.localeCompare(b.seat) || a.fleet.localeCompare(b.fleet) || a.base.localeCompare(b.base))
    .map(({ count, ...row }) => ({ ...row, countLabel: count.toLocaleString() })))
  const yearsOfServiceBuckets = computed(() => result.value?.yearsOfServiceBuckets ?? [])
  const userYos = computed(() => {
    const entry = newHire.syntheticEntry.value ?? userEntry.value
    return entry ? computeYOS(entry.hire_date, todayPlainDate()) : undefined
  })

  return {
    hasResult: computed(() => result.value !== null),
    qualificationComposition,
    matchingPilotCount,
    qualificationSizes,
    ageDistribution: computed(() => result.value?.ageDistribution ?? { buckets: [], nullCount: 0 }),
    captainQualificationThresholds: computed(() => result.value?.captainQualificationThresholds ?? []),
    yearsOfServiceDistribution: computed(() => result.value?.yearsOfServiceDistribution ?? EMPTY_YOS_DISTRIBUTION),
    yearsOfServiceBuckets,
    hasYearsOfService: computed(() => yearsOfServiceBuckets.value.some(bucket => bucket.count > 0)),
    retirementAge,
    userYos,
  }
}
