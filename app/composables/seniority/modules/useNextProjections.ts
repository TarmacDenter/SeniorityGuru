import { addYearsDate, diffDateYears, formatMonthYear, formatYear } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'
import { isNoResult, resultOrNull } from '~/utils/seniority'
import { useTrajectory } from './useTrajectory'
import { useScenario } from '~/composables/useScenario'
import { useScopeFilter } from '~/composables/useScopeFilter'
import { useSeniorityCore } from './useSeniorityCore'
import { useStanding } from './useStanding'

const DEBOUNCE_MS = 500
const SNAPSHOT_MIN_YEARS = 3
const SNAPSHOT_DEFAULT_YEARS = 5
const SNAPSHOT_MAX_YEARS = 10
const DEFAULT_TARGET_PERCENTILE = 50

/** Seniority Percentile with one decimal so columns align, e.g. "62.4%". */
const formatPercentile = (value: number) => `${value.toFixed(1)}%`

/**
 * What the Next panel adds to the trajectory: Project forward with its Qualification comparison.
 * Reads the shared Scenario (Qualification Scope, Growth Assumptions); only the projection
 * horizon is local to the panel.
 */
export function useNextProjections() {
  const { analysis, anchoredAnalysis, listAnalysis, projectionEndDate } = useSeniorityCore()
  const { growthAssumptions, qualificationScope, scopeLabel, scopeLabels } = useScenario()
  const { rankCard, retirementSnapshot } = useStanding(qualificationScope)
  const trajectory = useTrajectory(growthAssumptions, qualificationScope)

  // ── Project forward ──────────────────────────────────────────────────────
  const projectForward = ref(false)
  const yearsInput = ref(1)
  const projectionYears = ref(0)
  const projectionDate = computed(() => addYearsDate(todayPlainDate(), projectionYears.value))

  const sliderMax = computed(() => {
    if (!projectionEndDate.value) return 0
    return Math.max(1, Math.ceil(diffDateYears(todayPlainDate(), projectionEndDate.value)))
  })
  const canProjectForward = computed(() => sliderMax.value > 0)
  const yearsLabel = computed(() => `+${yearsInput.value}yr${yearsInput.value === 1 ? '' : 's'}`)
  const asOfLabel = computed(() => projectionYears.value > 0 ? `As of ${projectionDate.value}` : 'As of today')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  function cancelDebounce() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = null
  }

  watch(projectForward, (on) => {
    cancelDebounce()
    if (on) {
      projectionYears.value = yearsInput.value
    }
    else {
      yearsInput.value = 1
      projectionYears.value = 0
    }
  })
  watch(yearsInput, (years) => {
    cancelDebounce()
    if (!projectForward.value) return
    debounceTimer = setTimeout(() => {
      projectionYears.value = years
      debounceTimer = null
    }, DEBOUNCE_MS)
  })
  if (getCurrentScope()) onScopeDispose(cancelDebounce)

  // ── Qualification comparison ─────────────────────────────────────────────
  const positionsOutput = computed(() => anchoredAnalysis.value?.qualificationPositions({
    through: projectionDate.value,
    growthAssumptions: growthAssumptions.value,
  }).presentation ?? null)
  const qualificationPositions = computed(() => {
    const output = resultOrNull(positionsOutput.value)
    return output ? [...output] : []
  })
  const qualificationPositionsNoResultLabel = computed(() => {
    const output = positionsOutput.value
    return output && isNoResult(output) ? output.label : null
  })
  const hasProjection = computed(() => qualificationPositions.value
    .some(position => Math.abs(position.projectedPercentile - position.currentPercentile) > 0.1))
  const rosterSummaryLabel = computed(() => rankCard.value.rosterSummaryLabel)
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
  const retirementWave = computed(() => analysis.value?.retirementYearAnalysis(scopedScenario.value) ?? [])
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

  // ── Retirement snapshot ──────────────────────────────────────────────────
  const snapshotYears = ref(SNAPSHOT_DEFAULT_YEARS)
  const snapshotMaxYears = computed(() => Math.min(SNAPSHOT_MAX_YEARS, retirementSnapshot.value?.fullTrajectory.length ?? 0))
  watch(snapshotMaxYears, (max) => {
    snapshotYears.value = Math.max(Math.min(snapshotYears.value, max), Math.min(SNAPSHOT_MIN_YEARS, max))
  })
  const snapshot = computed(() => {
    const data = retirementSnapshot.value
    if (!data) return null
    const years = Math.min(snapshotYears.value, snapshotMaxYears.value)
    return {
      retireDateLabel: formatMonthYear(data.retireDate),
      projectedRankLabel: data.atRetirement.rank.toLocaleString(),
      percentileLabel: formatPercentile(data.atRetirement.percentile),
      pilotsAheadLabel: (data.atRetirement.rank - 1).toLocaleString(),
      rosterSizeLabel: data.rosterSize.toLocaleString(),
      activePilotLabel: data.activePilotCount.toLocaleString(),
      hypotheticalLabel: data.hypotheticalLabel,
      rows: data.fullTrajectory.slice(-years).map(point => ({
        yearLabel: formatYear(point.date),
        rankLabel: point.rank.toLocaleString(),
        percentileLabel: formatPercentile(point.percentile),
        changeLabel: point.rankDelta,
      })),
    }
  })

  return {
    ...trajectory,
    scopeOptions,
    scopeSuffix,
    retirementWave,
    wavePoints,
    threshold,
    snapshot,
    snapshotYears,
    snapshotMaxYears,
    projectForward,
    yearsInput,
    projectionYears,
    sliderMax,
    canProjectForward,
    yearsLabel,
    asOfLabel,
    qualificationPositions,
    qualificationPositionsNoResultLabel,
    hasProjection,
    rosterSummaryLabel,
    percentileScaleLabel,
    compareScopeLabel,
    compareScopeItems,
    projectionChart,
  }
}
