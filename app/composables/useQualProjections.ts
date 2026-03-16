import {
  computePowerIndexCells,
  computeRetirementWave,
  computeQualSnapshots,
  applyProjectionToSnapshots,
  findThresholdYear,
} from '#shared/utils/qual-analytics'
import {
  getProjectionEndDate,
  generateTimePoints,
  buildTrajectory,
  computeTrajectoryDeltas,
  type FilterFn,
} from '#shared/utils/seniority-math'
import type { ComputedRef } from 'vue'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserEntry } from './useUserEntry'

const BANNER_KEY = 'qual-projections-banner-dismissed'

const noFilter: FilterFn = () => true

export function useQualProjections(qualFilterFn: ComputedRef<FilterFn> = computed(() => noFilter)) {
  const seniorityStore = useSeniorityStore()
  const userEntry = useUserEntry({ withNewHireMode: true })

  const isBannerDismissed = ref(
    typeof localStorage !== 'undefined' ? localStorage.getItem(BANNER_KEY) === 'true' : false,
  )

  function dismissBanner() {
    isBannerDismissed.value = true
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BANNER_KEY, 'true')
    }
  }

  const projectionYears = ref(0) // 0–10 slider

  const projectionDate = computed(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + projectionYears.value)
    return d
  })

  const powerIndexCells = computed(() => {
    if (!userEntry.value) return []
    return computePowerIndexCells(
      seniorityStore.entries,
      userEntry.value.seniority_number,
      projectionDate.value,
    )
  })

  const retirementWave = computed(() =>
    computeRetirementWave(seniorityStore.entries, qualFilterFn.value),
  )

  const waveTrajectory = computed(() => {
    if (!userEntry.value) return []
    const { today, endDate } = getProjectionEndDate(userEntry.value.retire_date)
    const timePoints = generateTimePoints(today, endDate)
    return buildTrajectory(seniorityStore.entries, userEntry.value.seniority_number, timePoints, qualFilterFn.value)
  })

  const targetPercentile = ref(50) // 50 | 75 | 90

  const thresholdResult = computed(() => {
    if (!userEntry.value) return null

    const { today, endDate } = getProjectionEndDate(userEntry.value.retire_date)
    const timePoints = generateTimePoints(today, endDate)

    const base = buildTrajectory(
      seniorityStore.entries,
      userEntry.value.seniority_number,
      timePoints,
      qualFilterFn.value,
    )

    const scaleEntries = (mult: number) =>
      seniorityStore.entries.map((e) => {
        if (!e.retire_date) return e
        const daysUntil = (new Date(e.retire_date).getTime() - today.getTime()) * mult
        return {
          ...e,
          retire_date: new Date(today.getTime() + daysUntil).toISOString().split('T')[0]!,
        }
      })

    const optimistic = buildTrajectory(
      scaleEntries(0.9),
      userEntry.value.seniority_number,
      timePoints,
      qualFilterFn.value,
    )
    const pessimistic = buildTrajectory(
      scaleEntries(1.1),
      userEntry.value.seniority_number,
      timePoints,
      qualFilterFn.value,
    )

    return findThresholdYear(base, optimistic, pessimistic, targetPercentile.value)
  })

  const trajectoryDeltas = computed(() => computeTrajectoryDeltas(waveTrajectory.value))

  const qualSnapshots = computed(() => computeQualSnapshots(seniorityStore.entries))

  const qualScales = computed(() => {
    if (!userEntry.value || qualSnapshots.value.length === 0) return []
    return applyProjectionToSnapshots(qualSnapshots.value, seniorityStore.entries, userEntry.value.seniority_number, projectionDate.value)
  })

  return {
    isBannerDismissed,
    dismissBanner,
    projectionYears,
    projectionDate,
    userEntry,
    powerIndexCells,
    qualScales,
    retirementWave,
    waveTrajectory,
    trajectoryDeltas,
    targetPercentile,
    thresholdResult,
  }
}
