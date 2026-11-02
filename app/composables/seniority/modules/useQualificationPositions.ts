import type { Ref } from 'vue'
import { addYearsDate, diffDateYears } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'
import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, isNoResult, resultOrNull, type GrowthAssumptions } from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

/**
 * The Anchor Pilot's Seniority Percentile in every Qualification, today or projected forward by
 * whole years under the Growth Assumptions. Backs the Qualifications panel's seniority scale.
 */
export function useQualificationPositions(growthAssumptions?: Ref<GrowthAssumptions>) {
  const { anchoredAnalysis, projectionEndDate } = useSeniorityCore()
  const assumptions = growthAssumptions ?? ref<GrowthAssumptions>({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS })

  const projectForward = ref(false)
  const years = ref(1)
  const projectionYears = computed(() => (projectForward.value ? years.value : 0))
  const projectionDate = computed(() => addYearsDate(todayPlainDate(), projectionYears.value))
  const projectionLabel = computed(() => (projectionYears.value > 0 ? `As of ${projectionDate.value}` : 'As of today'))

  const sliderMax = computed(() => {
    if (!projectionEndDate.value) return 0
    return Math.max(1, Math.ceil(diffDateYears(todayPlainDate(), projectionEndDate.value)))
  })

  const output = computed(() => anchoredAnalysis.value?.qualificationPositions({
    through: projectionDate.value,
    growthAssumptions: assumptions.value,
  }).presentation ?? null)
  const noResultLabel = computed(() => (output.value && isNoResult(output.value) ? output.value.label : null))
  const positions = computed(() => {
    const result = resultOrNull(output.value)
    return result ? [...result] : []
  })
  const hasProjection = computed(() => positions.value.some(
    position => Math.abs(position.projectedPercentile - position.currentPercentile) > 0.1,
  ))

  return { positions, noResultLabel, hasProjection, projectForward, years, projectionYears, projectionLabel, sliderMax }
}
