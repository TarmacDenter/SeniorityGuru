import type { ComputedRef, Ref } from 'vue'
import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS } from '~/utils/seniority'
import type {
  AnchoredSeniorityAnalysis,
  GrowthAssumptions,
  PresentedRetirementCountProjection,
  PresentedSeniorityTrajectoryComparison,
  PresentedTrajectoryChange,
  QualificationScope,
} from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

type SeniorityTrajectoryPoint = ReturnType<AnchoredSeniorityAnalysis['seniorityTrajectory']>['domain']['points'][number]

export function useTrajectory(growthAssumptions?: Ref<GrowthAssumptions>): {
  chartData: ComputedRef<{ labels: string[]; data: number[] }>
  changes: ComputedRef<PresentedTrajectoryChange[]>
  fullTrajectory: ComputedRef<readonly SeniorityTrajectoryPoint[]>
  computeRetirementProjection: (scope?: QualificationScope) => PresentedRetirementCountProjection
  computeComparativeTrajectory: (baseline: QualificationScope, comparison: QualificationScope) => PresentedSeniorityTrajectoryComparison
} {
  const { analysis, anchoredAnalysis, projectionEndDate } = useSeniorityCore()
  const effectiveAssumptions = growthAssumptions
    ?? ref<GrowthAssumptions>({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS })

  const trajectory = computed(() => {
    const through = projectionEndDate.value
    return through
      ? anchoredAnalysis.value?.seniorityTrajectory({
          through,
          scenario: { growthAssumptions: effectiveAssumptions.value },
        }) ?? null
      : null
  })
  const chartData = computed(() => trajectory.value?.presentation.chartData ?? { labels: [], data: [] })
  const fullTrajectory = computed(() => trajectory.value?.domain.points ?? [])
  const changes = computed(() => trajectory.value?.presentation.changes ?? [])

  function computeRetirementProjection(scope: QualificationScope = {}): PresentedRetirementCountProjection {
    const through = projectionEndDate.value
    if (!analysis.value || !through) return { labels: [], data: [], scopedPilotCount: 0 }
    return analysis.value.retirementCountProjection({
      through,
      scenario: { qualificationScope: scope },
    }).presentation
  }

  function computeComparativeTrajectory(
    baseline: QualificationScope,
    comparison: QualificationScope,
  ): PresentedSeniorityTrajectoryComparison {
    const through = projectionEndDate.value
    if (!anchoredAnalysis.value || !through) return { labels: [], baselineData: [], comparisonData: [] }
    return anchoredAnalysis.value.seniorityTrajectoryComparison({
      through,
      baselineScenario: {
        qualificationScope: baseline,
        growthAssumptions: effectiveAssumptions.value,
      },
      comparisonScenario: {
        qualificationScope: comparison,
        growthAssumptions: effectiveAssumptions.value,
      },
    }).presentation
  }

  return {
    chartData,
    changes,
    fullTrajectory,
    computeRetirementProjection,
    computeComparativeTrajectory,
  }
}
