import {
  getProjectionEndDate,
  generateTimePoints,
  buildTrajectory,
  type FilterFn,
} from '#shared/utils/seniority-math'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

export interface UpgradeInterval {
  fromDate: string
  toDate: string
  upgrades: number
  fleetChanges: number
  downgrades: number
  byFleet: { fleet: string; upgrades: number; fleetChanges: number; downgrades: number }[]
}

export interface UpgradeTrackerResponse {
  intervals: UpgradeInterval[]
  totals: { upgrades: number; fleetChanges: number; downgrades: number }
  hasEnoughData: boolean
}

export function useQualUpgrades() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  // ─── Upgrade Tracker (server-side) ───
  const airlineId = computed(() => userStore.profile?.icao_code ?? null)
  const upgradeTrackerData = ref<UpgradeTrackerResponse | null>(null)
  const upgradeTrackerLoading = ref(false)
  const upgradeTrackerError = ref<string | null>(null)

  async function fetchUpgradeTracker() {
    if (!airlineId.value) return
    upgradeTrackerLoading.value = true
    upgradeTrackerError.value = null
    try {
      upgradeTrackerData.value = await $fetch<UpgradeTrackerResponse>(
        `/api/analytics/upgrade-tracker?airlineId=${airlineId.value}`,
      )
    }
    catch (e: unknown) {
      upgradeTrackerError.value = e instanceof Error ? e.message : 'Failed to load upgrade data'
    }
    finally {
      upgradeTrackerLoading.value = false
    }
  }

  watch(airlineId, (id) => { if (id) fetchUpgradeTracker() }, { immediate: true })

  // ─── What-If Simulator (client-side) ───
  const targetFleet = ref<string | null>(null)
  const targetSeat = ref<string | null>(null)
  const targetBase = ref<string | null>(null)

  const userEntry = computed(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    return seniorityStore.entries.find(e => e.employee_number === empNum)
  })

  const whatIfTrajectory = computed(() => {
    if (!userEntry.value) return { labels: [], currentData: [], targetData: [] }

    const { today } = getProjectionEndDate(userEntry.value.retire_date)
    const end = new Date(today)
    end.setFullYear(end.getFullYear() + 15)
    const timePoints = generateTimePoints(today, end)

    // Current qual filter
    const currentEntry = userEntry.value
    const currentFilter: FilterFn = e =>
      e.fleet === currentEntry.fleet && e.seat === currentEntry.seat

    // Target qual filter
    const targetFilter: FilterFn = (e) => {
      if (targetFleet.value && e.fleet !== targetFleet.value) return false
      if (targetSeat.value && e.seat !== targetSeat.value) return false
      if (targetBase.value && e.base !== targetBase.value) return false
      return true
    }

    const current = buildTrajectory(seniorityStore.entries, currentEntry.seniority_number, timePoints, currentFilter)
    const target = buildTrajectory(seniorityStore.entries, currentEntry.seniority_number, timePoints, targetFilter)

    return {
      labels: current.map(t => t.date),
      currentData: current.map(t => t.percentile),
      targetData: target.map(t => t.percentile),
    }
  })

  // Available fleets/seats for the target selector
  const availableFleets = computed(() =>
    [...new Set(seniorityStore.entries.map(e => e.fleet).filter(Boolean))].sort() as string[],
  )
  const availableSeats = computed(() =>
    [...new Set(seniorityStore.entries.map(e => e.seat).filter(Boolean))].sort() as string[],
  )

  return {
    upgradeTrackerData,
    upgradeTrackerLoading,
    upgradeTrackerError,
    fetchUpgradeTracker,
    targetFleet,
    targetSeat,
    targetBase,
    whatIfTrajectory,
    userEntry,
    availableFleets,
    availableSeats,
  }
}
