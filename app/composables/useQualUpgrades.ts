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

  return {
    upgradeTrackerData,
    upgradeTrackerLoading,
    upgradeTrackerError,
    fetchUpgradeTracker,
  }
}
