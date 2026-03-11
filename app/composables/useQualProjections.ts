import {
  computePowerIndexCells,
  computeRetirementWave,
  findThresholdYear,
} from '#shared/utils/qual-analytics'
import {
  getProjectionEndDate,
  generateTimePoints,
  buildTrajectory,
  type FilterFn,
} from '#shared/utils/seniority-math'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

const BANNER_KEY = 'qual-projections-banner-dismissed'

export function useQualProjections() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  // Assumptions banner dismiss state (localStorage)
  const isBannerDismissed = ref(
    typeof localStorage !== 'undefined' ? localStorage.getItem(BANNER_KEY) === 'true' : false,
  )

  function dismissBanner() {
    isBannerDismissed.value = true
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BANNER_KEY, 'true')
    }
  }

  // User entry
  const userEntry = computed(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    return seniorityStore.entries.find((e) => e.employee_number === empNum)
  })

  // Power Index
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

  // Retirement wave (qual selector)
  const waveFleet = ref<string | null>(null)
  const waveSeat = ref<string | null>(null)
  const waveBase = ref<string | null>(null)

  const retirementWave = computed(() => {
    const filterFn: FilterFn = (e) => {
      if (waveFleet.value && e.fleet !== waveFleet.value) return false
      if (waveSeat.value && e.seat !== waveSeat.value) return false
      if (waveBase.value && e.base !== waveBase.value) return false
      return true
    }
    return computeRetirementWave(seniorityStore.entries, filterFn)
  })

  // Trajectory overlay for wave chart — user's percentile within selected qual
  const waveTrajectory = computed(() => {
    if (!userEntry.value) return []
    const filterFn: FilterFn = (e) => {
      if (waveFleet.value && e.fleet !== waveFleet.value) return false
      if (waveSeat.value && e.seat !== waveSeat.value) return false
      return true
    }
    const { today } = getProjectionEndDate(userEntry.value.retire_date)
    const end = new Date(today)
    end.setFullYear(end.getFullYear() + 15)
    const timePoints = generateTimePoints(today, end)
    return buildTrajectory(seniorityStore.entries, userEntry.value.seniority_number, timePoints, filterFn)
  })

  // Percentile threshold calculator
  const thresholdFleet = ref<string | null>(null)
  const thresholdSeat = ref<string | null>(null)
  const thresholdBase = ref<string | null>(null)
  const targetPercentile = ref(50) // 50 | 75 | 90

  const thresholdResult = computed(() => {
    if (!userEntry.value) return null

    const filterFn: FilterFn = (e) => {
      if (thresholdFleet.value && e.fleet !== thresholdFleet.value) return false
      if (thresholdSeat.value && e.seat !== thresholdSeat.value) return false
      if (thresholdBase.value && e.base !== thresholdBase.value) return false
      return true
    }

    const { today } = getProjectionEndDate(userEntry.value.retire_date)
    const end = new Date(today)
    end.setFullYear(end.getFullYear() + 15)
    const timePoints = generateTimePoints(today, end)

    // Base trajectory
    const base = buildTrajectory(
      seniorityStore.entries,
      userEntry.value.seniority_number,
      timePoints,
      filterFn,
    )

    // Optimistic / pessimistic: scale retire dates closer / further
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
      filterFn,
    )
    const pessimistic = buildTrajectory(
      scaleEntries(1.1),
      userEntry.value.seniority_number,
      timePoints,
      filterFn,
    )

    return findThresholdYear(base, optimistic, pessimistic, targetPercentile.value)
  })

  return {
    isBannerDismissed,
    dismissBanner,
    projectionYears,
    projectionDate,
    userEntry,
    powerIndexCells,
    waveFleet,
    waveSeat,
    waveBase,
    retirementWave,
    waveTrajectory,
    thresholdFleet,
    thresholdSeat,
    thresholdBase,
    targetPercentile,
    thresholdResult,
  }
}
