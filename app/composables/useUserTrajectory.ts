import { createScenario } from '#shared/utils/seniority-engine'
import type { QualSpec } from '#shared/utils/seniority-engine'
import { DEFAULT_GROWTH_CONFIG, type GrowthConfig } from '#shared/types/growth-config'
import type { Ref } from 'vue'
import { useSeniorityEngine } from './useSeniorityEngine'

export function useUserTrajectory(growthConfig: Ref<GrowthConfig> = ref({ ...DEFAULT_GROWTH_CONFIG })) {
  const { lens } = useSeniorityEngine()

  const scenario = computed(() => createScenario({ growthConfig: growthConfig.value }))

  const fullTrajectory = computed(() => lens.value?.trajectory(scenario.value)?.points ?? [])

  const trajectoryChartData = computed(() => {
    const result = lens.value?.trajectory(scenario.value)
    if (!result) return { labels: [] as string[], data: [] as number[] }
    return result.chartData
  })

  const trajectoryDeltas = computed(() =>
    lens.value?.trajectory(scenario.value)?.deltas ?? [],
  )

  function computeRetirementProjection(spec: QualSpec = {}) {
    if (!lens.value) return { labels: [] as string[], data: [] as number[], filteredTotal: 0 }
    return lens.value.retirementProjection(createScenario({ scopeFilter: spec }))
  }

  function computeComparativeTrajectory(specA: QualSpec, specB: QualSpec) {
    if (!lens.value) return { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
    return lens.value.compareTrajectories(
      createScenario({ scopeFilter: specA, growthConfig: growthConfig.value }),
      createScenario({ scopeFilter: specB, growthConfig: growthConfig.value }),
    ) ?? { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
  }

  return {
    fullTrajectory,
    trajectoryChartData,
    trajectoryDeltas,
    computeRetirementProjection,
    computeComparativeTrajectory,
  }
}
