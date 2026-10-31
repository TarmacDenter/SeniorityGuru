import type { ComputedRef, Ref } from 'vue'
import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, isNoResult, resultOrNull } from '~/utils/seniority'
import type {
  AnchoredSeniorityAnalysis,
  GrowthAssumptions,
  PresentedRetirementCountProjection,
  PresentedTrajectoryChange,
  QualificationScope,
} from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

type SeniorityTrajectoryPoint = Exclude<ReturnType<AnchoredSeniorityAnalysis['seniorityTrajectory']>['domain'], { kind: 'no-result' }>['points'][number]

export interface ComparativeTrajectory {
  labels: string[]
  baselineData: number[]
  comparisonData: number[]
  /** Why no comparison exists (e.g. "Anchor Pilot not in scope"), or why it stopped early. */
  noResultLabel: string | null
}

function emptyComparison(noResultLabel: string | null): ComparativeTrajectory {
  return { labels: [], baselineData: [], comparisonData: [], noResultLabel }
}

export function useTrajectory(growthAssumptions?: Ref<GrowthAssumptions>): {
  chartData: ComputedRef<{ labels: string[]; data: number[] }>
  changes: ComputedRef<PresentedTrajectoryChange[]>
  fullTrajectory: ComputedRef<readonly SeniorityTrajectoryPoint[]>
  computeRetirementProjection: (scope?: QualificationScope) => PresentedRetirementCountProjection
  computeComparativeTrajectory: (baseline: QualificationScope, comparison: QualificationScope) => ComparativeTrajectory
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
  const presented = computed(() => resultOrNull(trajectory.value?.presentation))
  const domain = computed(() => resultOrNull(trajectory.value?.domain))
  const chartData = computed(() => presented.value?.chartData ?? { labels: [], data: [] })
  const fullTrajectory = computed(() => domain.value?.points ?? [])
  const changes = computed(() => presented.value?.changes ?? [])

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
  ): ComparativeTrajectory {
    const through = projectionEndDate.value
    if (!anchoredAnalysis.value || !through) return emptyComparison(null)
    const { presentation } = anchoredAnalysis.value.seniorityTrajectoryComparison({
      through,
      baselineScenario: {
        qualificationScope: baseline,
        growthAssumptions: effectiveAssumptions.value,
      },
      comparisonScenario: {
        qualificationScope: comparison,
        growthAssumptions: effectiveAssumptions.value,
      },
    })
    if (isNoResult(presentation)) return emptyComparison(presentation.label)
    return { ...presentation, noResultLabel: presentation.endedByLabel }
  }

  return {
    chartData,
    changes,
    fullTrajectory,
    computeRetirementProjection,
    computeComparativeTrajectory,
  }
}
