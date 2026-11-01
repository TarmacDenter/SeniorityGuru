import { addYearsDate, diffDateYears, formatMonthYear, formatYear } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'
import { formatSeniorityPercentile, isNoResult, resultOrNull } from '~/utils/seniority'
import { useTrajectory } from './useTrajectory'
import { useScenario } from '~/composables/useScenario'
import { useSeniorityCore } from './useSeniorityCore'
import { useStanding } from './useStanding'

const DEBOUNCE_MS = 500
const SNAPSHOT_MIN_YEARS = 3
const SNAPSHOT_DEFAULT_YEARS = 5
const SNAPSHOT_MAX_YEARS = 10
const DEFAULT_TARGET_PERCENTILE = 50

/**
 * What the Next panel adds to the trajectory: Project forward with its Qualification comparison.
 * Reads the shared Scenario (Qualification Scope, Growth Assumptions); only the projection
 * horizon is local to the panel.
 */
export function useNextProjections() {
  const { analysis, anchoredAnalysis, listAnalysis, projectionEndDate } = useSeniorityCore()
  const { growthAssumptions, qualificationScope, scopeLabel } = useScenario()
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
      percentileLabel: formatSeniorityPercentile(data.atRetirement.percentile),
      pilotsAheadLabel: (data.atRetirement.rank - 1).toLocaleString(),
      rosterSizeLabel: data.rosterSize.toLocaleString(),
      activePilotLabel: data.activePilotCount.toLocaleString(),
      hypotheticalLabel: data.hypotheticalLabel,
      rows: data.fullTrajectory.slice(-years).map(point => ({
        yearLabel: formatYear(point.date),
        rankLabel: point.rank.toLocaleString(),
        percentileLabel: formatSeniorityPercentile(point.percentile),
        changeLabel: point.rankDelta,
      })),
    }
  })

  // ── Rate of change ───────────────────────────────────────────────────────
  const bestYearLabel = computed(() => {
    let best: (typeof trajectory.changes.value)[number] | null = null
    for (const change of trajectory.changes.value) {
      if (!best || change.percentilePointChange > best.percentilePointChange) best = change
    }
    if (!best || best.percentilePointChange <= 0) return null
    return `Best year: ${best.yearLabel} (+${best.percentilePointChange.toFixed(1)}pp)`
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
    bestYearLabel,
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
  }
}
