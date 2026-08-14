import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useImportAttemptsStore } from '~/stores/import-attempts'
import { createLogger } from '~/utils/logger'

export function useClearAllData() {
  const log = createLogger('clear-all-data')
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()
  const importAttemptsStore = useImportAttemptsStore()

  async function clearAllData() {
    log.info('Clearing all data')
    try {
      await seniorityStore.clearAll()
      await userStore.clearPreferences()
      await importAttemptsStore.clear()
      log.info('All data cleared')
    }
    catch (e: unknown) {
      log.error('Failed to clear all data', { error: String(e) })
      throw e
    }
  }

  return { clearAllData }
}
