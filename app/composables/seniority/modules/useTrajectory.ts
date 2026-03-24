import type { ComputedRef, Ref } from 'vue'
import { DEFAULT_GROWTH_CONFIG, type GrowthConfig } from '~/utils/growth-config'
import { createScenario } from '~/utils/seniority-engine'
import type { QualSpec, TrajectoryDelta, TrajectoryPoint, RetirementProjectionResult, ComparativeTrajectoryResult } from '~/utils/seniority-engine'
import { useSeniorityCore } from './useSeniorityCore'

export function useTrajectory(growthConfig?: Ref<GrowthConfig>): {
  chartData: ComputedRef<{ labels: string[]; data: number[] }>
  deltas: ComputedRef<TrajectoryDelta[]>
  fullTrajectory: ComputedRef<TrajectoryPoint[]>
  computeRetirementProjection: (spec?: QualSpec) => RetirementProjectionResult
  computeComparativeTrajectory: (specA: QualSpec, specB: QualSpec) => ComparativeTrajectoryResult
} {
  const { lens } = useSeniorityCore()
  const effectiveConfig = growthConfig ?? ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG })

  const scenario = computed(() => createScenario({ growthConfig: effectiveConfig.value }))

  const chartData = computed(() => {
    const result = lens.value?.trajectory(scenario.value)
    if (!result) return { labels: [] as string[], data: [] as number[] }
    return result.chartData
  })

  const fullTrajectory = computed(() =>
    lens.value?.trajectory(scenario.value)?.points ?? [],
  )

  const deltas = computed(() =>
    lens.value?.trajectory(scenario.value)?.deltas ?? [],
  )

  function computeRetirementProjection(spec: QualSpec = {}): RetirementProjectionResult {
    if (!lens.value) return { labels: [] as string[], data: [] as number[], filteredTotal: 0 }
    return lens.value.retirementProjection(createScenario({ scopeFilter: spec }))
  }

  function computeComparativeTrajectory(specA: QualSpec, specB: QualSpec): ComparativeTrajectoryResult {
    if (!lens.value) return { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
    return lens.value.compareTrajectories(
      createScenario({ scopeFilter: specA, growthConfig: effectiveConfig.value }),
      createScenario({ scopeFilter: specB, growthConfig: effectiveConfig.value }),
    ) ?? { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
  }

  return {
    chartData,
    deltas,
    fullTrajectory,
    computeRetirementProjection,
    computeComparativeTrajectory,
  }
}
