import type { Ref } from 'vue'
import { DEFAULT_GROWTH_CONFIG, type GrowthConfig } from '~/utils/growth-config'
import type { QualSpec } from '~/utils/seniority-engine'
import { createLens, createScenario, qualSpecLabel } from '~/utils/seniority-engine'
import { uniqueEntryValues } from '~/utils/entry-filters'
import { useSeniorityCore } from './useSeniorityCore'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

const BANNER_KEY = 'qual-projections-banner-dismissed'

export function useQualAnalytics(growthConfig?: Ref<GrowthConfig>) {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()
  const { snapshot, lens, userEntry } = useSeniorityCore()
  const effectiveGrowthConfig = growthConfig ?? ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG })

  // Filter state — each instance gets its own refs
  const selectedFleet = ref<string | null>(null)
  const selectedSeat = ref<string | null>(null)
  const selectedBase = ref<string | null>(null)

  const availableFleets = computed(() => snapshot.value?.uniqueFleets ?? [])
  const availableSeats = computed(() => snapshot.value?.uniqueSeats ?? [])
  const availableBases = computed(() => {
    const filtered = seniorityStore.entries.filter((e) => {
      if (selectedFleet.value && e.fleet !== selectedFleet.value) return false
      if (selectedSeat.value && e.seat !== selectedSeat.value) return false
      return true
    })
    return uniqueEntryValues(filtered, 'base')
  })

  const qualSpec = computed<QualSpec>(() => {
    const spec: { fleet?: string; seat?: string; base?: string } = {}
    if (selectedFleet.value) spec.fleet = selectedFleet.value
    if (selectedSeat.value) spec.seat = selectedSeat.value
    if (selectedBase.value) spec.base = selectedBase.value
    return spec
  })

  const qualLabel = computed(() => {
    const label = qualSpecLabel(qualSpec.value)
    return label === 'Company-wide' ? '' : label
  })

  // Auto-clear filters when available options change
  watch(availableFleets, (fleets) => {
    if (selectedFleet.value && !fleets.includes(selectedFleet.value))
      selectedFleet.value = null
  })
  watch(availableSeats, (seats) => {
    if (selectedSeat.value && !seats.includes(selectedSeat.value))
      selectedSeat.value = null
  })
  watch(availableBases, (bases) => {
    if (selectedBase.value && !bases.includes(selectedBase.value))
      selectedBase.value = null
  })

  // Demographics
  const mandatoryAge = computed(() => userStore.retirementAge)

  const demographicScenario = computed(() => createScenario({ scopeFilter: qualSpec.value }))

  const demographicsResult = computed(() => {
    if (!snapshot.value) return null
    const l = lens.value ?? createLens(snapshot.value)
    return l.demographics(mandatoryAge.value, demographicScenario.value)
  })

  const ageDistribution = computed(() =>
    demographicsResult.value?.ageDistribution ?? { buckets: [], nullCount: 0 },
  )

  const mostJuniorCAs = computed(() =>
    demographicsResult.value?.mostJuniorCAs ?? [],
  )

  const qualComposition = computed(() =>
    demographicsResult.value?.qualComposition ?? [],
  )

  const yosDistribution = computed(() =>
    demographicsResult.value?.yosDistribution
    ?? { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 },
  )

  const yosHistogram = computed(() =>
    demographicsResult.value?.yosHistogram ?? [],
  )

  // Projection controls
  const projectionYears = ref(0)

  const projectionDate = computed(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + projectionYears.value)
    return d
  })

  // Position scenario: no scope filter, for powerIndexCells + qualScales
  const positionScenario = computed(() => createScenario({
    projectionDate: projectionDate.value,
    growthConfig: effectiveGrowthConfig.value,
  }))

  const powerIndexCells = computed(() =>
    lens.value?.holdability(positionScenario.value) ?? [],
  )

  const qualScales = computed(() =>
    lens.value?.qualScales(positionScenario.value) ?? [],
  )

  // Scoped scenario: with qualSpec filter, for retirementWave, waveTrajectory, etc.
  const scopedScenario = computed(() => createScenario({
    growthConfig: effectiveGrowthConfig.value,
    scopeFilter: qualSpec.value,
  }))

  const retirementWave = computed(() =>
    lens.value?.retirementWave(scopedScenario.value) ?? [],
  )

  const waveTrajectoryResult = computed(() =>
    lens.value?.trajectory(scopedScenario.value) ?? null,
  )
  const waveTrajectory = computed(() => waveTrajectoryResult.value?.points ?? [])
  const trajectoryDeltas = computed(() => waveTrajectoryResult.value?.deltas ?? [])

  const targetPercentile = ref(50)

  const thresholdResult = computed(() =>
    lens.value?.percentileCrossing(
      targetPercentile.value,
      scopedScenario.value,
    ) ?? null,
  )

  // Banner UI state
  const isBannerDismissed = ref(
    typeof localStorage !== 'undefined' ? localStorage.getItem(BANNER_KEY) === 'true' : false,
  )

  function dismissBanner() {
    isBannerDismissed.value = true
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BANNER_KEY, 'true')
    }
  }

  function clearFilter() {
    selectedFleet.value = null
    selectedSeat.value = null
    selectedBase.value = null
  }

  return {
    // Filter controls
    selectedFleet,
    selectedSeat,
    selectedBase,
    availableFleets,
    availableSeats,
    availableBases,
    qualSpec,
    qualLabel,
    clearFilter,

    // Demographics
    ageDistribution,
    mostJuniorCAs,
    qualComposition,
    yosDistribution,
    yosHistogram,

    // Projections
    projectionYears,
    powerIndexCells,
    qualScales,
    retirementWave,
    waveTrajectory,
    trajectoryDeltas,
    targetPercentile,
    thresholdResult,

    // Banner UI state
    isBannerDismissed,
    dismissBanner,

    // User context
    userEntry,
  }
}
