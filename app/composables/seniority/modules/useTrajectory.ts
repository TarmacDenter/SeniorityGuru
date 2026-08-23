import type { ComputedRef, Ref } from 'vue'
import {
  DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS,
  createSeniorityScenario,
  presentRetirementCountProjection,
  presentSeniorityTrajectory,
  presentSeniorityTrajectoryComparison,
} from '~/utils/seniority'
import type {
  GrowthAssumptions,
  PresentedTrajectoryChange,
  QualificationScope,
  SeniorityTrajectoryPoint,
} from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

interface RetirementProjectionPresentation {
  labels: string[]
  data: number[]
  scopedPilotCount: number
}

interface TrajectoryComparisonPresentation {
  labels: string[]
  baselineData: number[]
  comparisonData: number[]
}

export function useTrajectory(growthAssumptions?: Ref<GrowthAssumptions>): {
  chartData: ComputedRef<{ labels: string[]; data: number[] }>
  changes: ComputedRef<PresentedTrajectoryChange[]>
  fullTrajectory: ComputedRef<readonly SeniorityTrajectoryPoint[]>
  computeRetirementProjection: (scope?: QualificationScope) => RetirementProjectionPresentation
  computeComparativeTrajectory: (baseline: QualificationScope, comparison: QualificationScope) => TrajectoryComparisonPresentation
} {
  const { lens, anchoredLens, projectionEndDate } = useSeniorityCore()
  const effectiveAssumptions = growthAssumptions
    ?? ref<GrowthAssumptions>({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS })
  const scenario = computed(() => createSeniorityScenario({ growthAssumptions: effectiveAssumptions.value }))

  const trajectory = computed(() => {
    const through = projectionEndDate.value
    return through ? anchoredLens.value?.seniorityTrajectory({ through, scenario: scenario.value }) ?? null : null
  })
  const presentedTrajectory = computed(() => trajectory.value ? presentSeniorityTrajectory(trajectory.value) : null)
  const chartData = computed(() => presentedTrajectory.value?.chartData ?? { labels: [], data: [] })
  const fullTrajectory = computed(() => trajectory.value?.points ?? [])
  const changes = computed(() => presentedTrajectory.value?.changes ?? [])

  function computeRetirementProjection(scope: QualificationScope = {}): RetirementProjectionPresentation {
    const through = projectionEndDate.value
    if (!lens.value || !through) return { labels: [], data: [], scopedPilotCount: 0 }
    return presentRetirementCountProjection(lens.value.retirementCountProjection({
      through,
      scenario: createSeniorityScenario({ qualificationScope: scope }),
    }))
  }

  function computeComparativeTrajectory(
    baseline: QualificationScope,
    comparison: QualificationScope,
  ): TrajectoryComparisonPresentation {
    const through = projectionEndDate.value
    if (!anchoredLens.value || !through) return { labels: [], baselineData: [], comparisonData: [] }
    return presentSeniorityTrajectoryComparison(anchoredLens.value.seniorityTrajectoryComparison({
      through,
      baselineScenario: createSeniorityScenario({
        qualificationScope: baseline,
        growthAssumptions: effectiveAssumptions.value,
      }),
      comparisonScenario: createSeniorityScenario({
        qualificationScope: comparison,
        growthAssumptions: effectiveAssumptions.value,
      }),
    }))
  }

  return {
    chartData,
    changes,
    fullTrajectory,
    computeRetirementProjection,
    computeComparativeTrajectory,
  }
}
