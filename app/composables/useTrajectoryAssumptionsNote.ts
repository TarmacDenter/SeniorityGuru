import { useUserStore } from '~/stores/user'

/** Whether the pilot has dismissed the Trajectory assumptions note. Remembered across visits; reopened from its one-line summary. */
export function useTrajectoryAssumptionsNote() {
  const userStore = useUserStore()
  const dismissed = ref(false)

  void userStore.getPreference('trajectoryAssumptionsDismissed').then((saved) => {
    dismissed.value = saved ?? false
  })

  async function toggle() {
    dismissed.value = !dismissed.value
    await userStore.savePreference('trajectoryAssumptionsDismissed', dismissed.value)
  }

  return { dismissed, toggle }
}
