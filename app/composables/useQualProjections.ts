import { createScenario } from '#shared/utils/seniority-engine'
import type { FilterFn } from '#shared/utils/seniority-math'
import { DEFAULT_GROWTH_CONFIG, type GrowthConfig } from '#shared/types/growth-config'
import type { ComputedRef, Ref } from 'vue'
import { useSeniorityEngine } from './useSeniorityEngine'

const BANNER_KEY = 'qual-projections-banner-dismissed'

const noFilter: FilterFn = () => true

export function useQualProjections(
  qualFilterFn: ComputedRef<FilterFn> = computed(() => noFilter),
  growthConfig: Ref<GrowthConfig> = ref({ ...DEFAULT_GROWTH_CONFIG }),
) {
  const { lens } = useSeniorityEngine()

  const isBannerDismissed = ref(
    typeof localStorage !== 'undefined' ? localStorage.getItem(BANNER_KEY) === 'true' : false,
  )

  function dismissBanner() {
    isBannerDismissed.value = true
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BANNER_KEY, 'true')
    }
  }

  const projectionYears = ref(0)

  const projectionDate = computed(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + projectionYears.value)
    return d
  })

  const positionScenario = computed(() => createScenario({
    projectionDate: projectionDate.value,
    growthConfig: growthConfig.value,
  }))

  const scopedScenario = computed(() => createScenario({
    growthConfig: growthConfig.value,
    scopeFilter: qualFilterFn.value,
  }))

  const powerIndexCells = computed(() =>
    lens.value?.holdability(positionScenario.value) ?? [],
  )

  const retirementWave = computed(() =>
    lens.value?.retirementWave(scopedScenario.value) ?? [],
  )

  const waveTrajectoryResult = computed(() =>
    lens.value?.trajectory(scopedScenario.value) ?? null,
  )
  const waveTrajectory = computed(() => waveTrajectoryResult.value?.points ?? [])

  const targetPercentile = ref(50)

  const thresholdResult = computed(() =>
    lens.value?.percentileCrossing(
      targetPercentile.value,
      scopedScenario.value,
    ) ?? null,
  )

  const trajectoryDeltas = computed(() => waveTrajectoryResult.value?.deltas ?? [])

  const qualScales = computed(() =>
    lens.value?.qualScales(positionScenario.value) ?? [],
  )

  const userEntry = computed(() => lens.value?.anchor
    ? { seniority_number: lens.value.anchor.seniorityNumber }
    : undefined,
  )

  return {
    isBannerDismissed,
    dismissBanner,
    projectionYears,
    projectionDate,
    userEntry,
    powerIndexCells,
    qualScales,
    retirementWave,
    waveTrajectory,
    trajectoryDeltas,
    targetPercentile,
    thresholdResult,
    growthConfig,
  }
}
