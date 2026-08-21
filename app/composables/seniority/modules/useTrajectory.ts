import type { ComputedRef, Ref } from 'vue'
import { DEFAULT_GROWTH_CONFIG, createScenario } from '~/utils/seniority-engine'
import type { GrowthConfig, QualSpec, TrajectoryDelta, TrajectoryPoint, RetirementProjectionResult, ComparativeTrajectoryResult } from '~/utils/seniority-engine'
import { todayPlainDate } from '~/utils/temporal'
import { useSeniorityCore } from './useSeniorityCore'

export function useTrajectory(growthConfig?: Ref<GrowthConfig>): {
  chartData: ComputedRef<{ labels: string[]; data: number[] }>
  deltas: ComputedRef<TrajectoryDelta[]>
  fullTrajectory: ComputedRef<TrajectoryPoint[]>
  computeRetirementProjection: (spec?: QualSpec) => RetirementProjectionResult
  computeComparativeTrajectory: (specA: QualSpec, specB: QualSpec) => ComparativeTrajectoryResult
} {
  const { lens, anchoredLens, projectionEndDate } = useSeniorityCore()
  const effectiveConfig = growthConfig ?? ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG })

  const scenario = computed(() => createScenario({ projectionDate: todayPlainDate(), growthConfig: effectiveConfig.value }))

  const chartData = computed(() => {
    const endDate = projectionEndDate.value
    const result = endDate ? anchoredLens.value?.trajectory(endDate, scenario.value) : null
    if (!result) return { labels: [] as string[], data: [] as number[] }
    return result.chartData
  })

  const fullTrajectory = computed(() =>
    (projectionEndDate.value ? anchoredLens.value?.trajectory(projectionEndDate.value, scenario.value)?.points : undefined) ?? [],
  )

  const deltas = computed(() =>
    (projectionEndDate.value ? anchoredLens.value?.trajectory(projectionEndDate.value, scenario.value)?.deltas : undefined) ?? [],
  )

  function computeRetirementProjection(spec: QualSpec = {}): RetirementProjectionResult {
    if (!lens.value) return { labels: [] as string[], data: [] as number[], filteredTotal: 0 }
    if (!projectionEndDate.value) return { labels: [], data: [], filteredTotal: 0 }
    return lens.value.retirementProjection({
      scenario: createScenario({ projectionDate: todayPlainDate(), scopeFilter: spec }),
      through: projectionEndDate.value,
    })
  }

  function computeComparativeTrajectory(specA: QualSpec, specB: QualSpec): ComparativeTrajectoryResult {
    if (!anchoredLens.value) return { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
    if (!projectionEndDate.value) return { labels: [], currentData: [], compareData: [] }
    return anchoredLens.value.compareTrajectories(
      createScenario({ projectionDate: todayPlainDate(), scopeFilter: specA, growthConfig: effectiveConfig.value }),
      createScenario({ projectionDate: todayPlainDate(), scopeFilter: specB, growthConfig: effectiveConfig.value }),
      projectionEndDate.value,
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
