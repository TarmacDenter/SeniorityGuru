import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

export function useClearAllData() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  async function clearAllData() {
    await seniorityStore.clearAll()
    await userStore.clearPreferences()
  }

  return { clearAllData }
}
