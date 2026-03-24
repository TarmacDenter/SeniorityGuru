import { useUserStore } from '~/stores/user'
import { useSeniorityStore } from '~/stores/seniority'

export function useUser() {
  const store = useUserStore()
  const seniorityStore = useSeniorityStore()

  const employeeNumber = computed(() => store.employeeNumber)
  const retirementAge = computed(() => store.retirementAge)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)

  const entry = computed(() => {
    const empNum = store.employeeNumber
    if (!empNum) return undefined
    return seniorityStore.entries.find((e) => e.employee_number === empNum)
  })

  /**
   * Persists a preference key/value pair to Dexie and updates the store.
   */
  async function savePreference(key: string, value: string): Promise<{ error: Error | null }> {
    try {
      await store.savePreference(key, value)
      return { error: null }
    }
    catch (e: unknown) {
      return { error: e instanceof Error ? e : new Error('Failed to save preference') }
    }
  }

  async function loadPreferences() {
    await store.loadPreferences()
  }

  async function clearPreferences() {
    await store.clearPreferences()
  }

  return { employeeNumber, retirementAge, loading, error, entry, savePreference, loadPreferences, clearPreferences }
}
