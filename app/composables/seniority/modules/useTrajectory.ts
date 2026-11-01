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
  /** Why no comparison exists (e.g. "Anchor Pilot retired"), or why it stopped early. */
  noResultLabel: string | null
  /** Hypothetical Placement labels for a side whose scope excludes the Anchor Pilot; null otherwise. */
  baselineHypotheticalLabel: string | null
  comparisonHypotheticalLabel: string | null
}

function emptyComparison(noResultLabel: string | null): ComparativeTrajectory {
  return {
    labels: [],
    baselineData: [],
    comparisonData: [],
    noResultLabel,
    baselineHypotheticalLabel: null,
    comparisonHypotheticalLabel: null,
  }
}

const KEY_CHANGE_COUNT = 5

export function useTrajectory(
  growthAssumptions?: Ref<GrowthAssumptions>,
  qualificationScope?: Ref<QualificationScope> | ComputedRef<QualificationScope>,
): {
  chartData: ComputedRef<{ labels: string[]; data: number[] }>
  changes: ComputedRef<PresentedTrajectoryChange[]>
  /** The years with the largest percentile movement, in date order, for the Next panel. */
  keyChanges: ComputedRef<PresentedTrajectoryChange[]>
  /** "Hypothetical Placement in <scope>" when the Anchor Pilot is outside the Qualification Scope; otherwise null. */
  hypotheticalLabel: ComputedRef<string | null>
  /** Why the samples stop early, e.g. "Anchor Pilot retired"; null when the window completes. */
  endedByLabel: ComputedRef<string | null>
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
          scenario: {
            growthAssumptions: effectiveAssumptions.value,
            qualificationScope: qualificationScope?.value ?? {},
          },
        }) ?? null
      : null
  })
  const presented = computed(() => resultOrNull(trajectory.value?.presentation))
  const domain = computed(() => resultOrNull(trajectory.value?.domain))
  const chartData = computed(() => presented.value?.chartData ?? { labels: [], data: [] })
  const fullTrajectory = computed(() => domain.value?.points ?? [])
  const changes = computed(() => presented.value?.changes ?? [])
  const keyChanges = computed(() => [...changes.value]
    .filter(change => change.percentilePointChange !== 0)
    .sort((a, b) => Math.abs(b.percentilePointChange) - Math.abs(a.percentilePointChange)
      || a.date.toString().localeCompare(b.date.toString()))
    .slice(0, KEY_CHANGE_COUNT)
    .sort((a, b) => a.date.toString().localeCompare(b.date.toString())))
  const hypotheticalLabel = computed(() => presented.value?.hypotheticalLabel ?? null)
  const endedByLabel = computed(() => presented.value?.endedByLabel ?? null)

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
    keyChanges,
    hypotheticalLabel,
    endedByLabel,
    fullTrajectory,
    computeRetirementProjection,
    computeComparativeTrajectory,
  }
}
