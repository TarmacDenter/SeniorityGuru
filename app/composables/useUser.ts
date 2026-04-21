import { useUserStore } from '~/stores/user'
import { useSeniorityStore } from '~/stores/seniority'
import type { PreferenceMap } from '~/utils/preferences'
import { canonicalizeEmployeeNumber } from '~/utils/schemas/seniority-list'

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
    const canonicalEmpNum = canonicalizeEmployeeNumber(empNum)
    return seniorityStore.entries.find((e) => canonicalizeEmployeeNumber(e.employee_number) === canonicalEmpNum)
  })

  /**
   * Persists a typed preference key/value pair to Dexie and updates the store.
   */
  async function savePreference<K extends keyof PreferenceMap>(key: K, value: PreferenceMap[K]): Promise<{ error: Error | null }> {
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
