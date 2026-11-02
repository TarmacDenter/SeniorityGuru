import { addYearsDate, diffDateYears } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'
import { isNoResult, resultOrNull } from '~/utils/seniority'
import { useTrajectory } from './useTrajectory'
import { useScenario } from '~/composables/useScenario'
import { useScopeFilter } from '~/composables/useScopeFilter'
import { useSeniorityCore } from './useSeniorityCore'
import { useStanding } from './useStanding'

const SENIOR_DEFAULT_YEARS = 5
const DEFAULT_TARGET_PERCENTILE = 50

/**
 * What Trajectory adds to the trajectory: the scope overlay, Retirement Wave, Percentile Threshold
 * and N-year retirement count. Reads the shared Scenario (Qualification Scope, Growth Assumptions).
 */
export function useNextProjections() {
  const { analysis, anchoredAnalysis, listAnalysis, projectionEndDate } = useSeniorityCore()
  const { growthAssumptions, qualificationScope, scopeLabel, scopeLabels } = useScenario()
  const { rankCard } = useStanding(qualificationScope)
  const trajectory = useTrajectory(growthAssumptions, qualificationScope)

  /** Whole years until the Anchor Pilot retires (0 with no Anchor Pilot). */
  const sliderMax = computed(() => {
    if (!projectionEndDate.value) return 0
    return Math.max(1, Math.ceil(diffDateYears(todayPlainDate(), projectionEndDate.value)))
  })
  /** The scoped Roster Size the trajectory's Seniority Percentile is measured against. */
  const percentileScaleLabel = computed(() => rankCard.value.percentileScaleLabel)

  // ── Compare with scope: a second trajectory on the Projection chart's axes ──
  // Held once so it survives moving between small views; undefined means no overlay.
  const compareScopeLabel = useState<string | undefined>('trajectoryCompareScopeLabel', () => undefined)
  const compareScopeItems = computed(() => scopeLabels.value.filter(label => label !== scopeLabel.value))
  const scopeOptionList = computed(() => listAnalysis.value?.catalog.qualificationScopeOptions ?? [])
  const { specForLabel } = useScopeFilter(scopeOptionList)
  const projectionChart = computed(() => {
    const alone = { label: scopeLabel.value, ...trajectory.chartData.value, overlay: null }
    const compare = compareScopeLabel.value
    if (!compare || compare === scopeLabel.value) return alone
    const comparison = trajectory.computeComparativeTrajectory(qualificationScope.value, specForLabel(compare))
    if (comparison.labels.length === 0) return alone
    const named = (label: string, hypotheticalLabel: string | null) => hypotheticalLabel ? `${label} (Hypothetical Placement)` : label
    return {
      label: named(scopeLabel.value, comparison.baselineHypotheticalLabel),
      labels: comparison.labels,
      data: comparison.baselineData,
      overlay: {
        label: named(compare, comparison.comparisonHypotheticalLabel),
        data: comparison.comparisonData,
        hypotheticalLabel: comparison.comparisonHypotheticalLabel,
      },
    }
  })

  // ── Retirement analysis, in the shared Qualification Scope ───────────────
  const scopeOptions = computed(() => listAnalysis.value?.catalog.qualificationScopeOptions ?? [])
  const scopeSuffix = computed(() => scopeLabel.value === 'Company-wide' ? '' : ` \u2014 ${scopeLabel.value}`)
  const scopedScenario = computed(() => ({
    growthAssumptions: growthAssumptions.value,
    qualificationScope: qualificationScope.value,
  }))
  const retirementWave = computed(() => trajectory.retirementWave.value.buckets.length
    ? trajectory.retirementWave.value.buckets
    : analysis.value?.retirementYearAnalysis(scopedScenario.value) ?? [])
  const wavePercentileSeries = computed(() => trajectory.retirementWave.value.percentileSeries)
  const wavePoints = computed(() => trajectory.fullTrajectory.value)

  const targetPercentile = ref(DEFAULT_TARGET_PERCENTILE)
  const targetMin = computed(() => wavePoints.value[0]?.percentile ?? 0)
  const targetMax = computed(() => Math.max(targetMin.value, wavePoints.value.at(-1)?.percentile ?? targetMin.value))
  watch([targetMin, targetMax], ([min, max]) => {
    targetPercentile.value = Math.min(Math.max(targetPercentile.value, min), max)
  }, { immediate: true })
  const thresholdOutput = computed(() => projectionEndDate.value
    ? anchoredAnalysis.value?.percentileCrossing({
        targetPercentile: targetPercentile.value,
        through: projectionEndDate.value,
        scenario: scopedScenario.value,
      }).presentation ?? null
    : null)
  const threshold = {
    target: targetPercentile,
    min: targetMin,
    max: targetMax,
    result: computed(() => resultOrNull(thresholdOutput.value)),
    noResultLabel: computed(() => {
      const output = thresholdOutput.value
      return isNoResult(output) ? output.label : null
    }),
  }

  // ── Retirements senior to the Anchor Pilot within N years ────────────────
  const yearsChoice = ref(SENIOR_DEFAULT_YEARS)
  /** Whole years until the Anchor Pilot retires; past that no retirement moves them. */
  const seniorMaxYears = computed(() => Math.max(1, sliderMax.value))
  const seniorYears = computed<number>({
    get: () => Math.min(Math.max(1, yearsChoice.value), seniorMaxYears.value),
    set: (years) => { yearsChoice.value = years },
  })
  const seniorProjection = computed(() => {
    const from = todayPlainDate()
    return anchoredAnalysis.value?.retirementCountProjection({
      through: addYearsDate(from, seniorYears.value),
      scenario: { qualificationScope: qualificationScope.value },
    }).presentation ?? null
  })
  const seniorCount = computed(() => seniorProjection.value?.seniorRetirementCount ?? null)
  const seniorLabel = computed(() => seniorProjection.value?.seniorRetirementLabel ?? null)
  const seniorRetirements = { years: seniorYears, maxYears: seniorMaxYears, count: seniorCount, label: seniorLabel }

  return {
    ...trajectory,
    scopeOptions,
    scopeSuffix,
    retirementWave,
    wavePoints,
    wavePercentileSeries,
    threshold,
    seniorRetirements,
    percentileScaleLabel,
    compareScopeLabel,
    compareScopeItems,
    projectionChart,
  }
}
