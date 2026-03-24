import { defineStore } from 'pinia'
import { db } from '~/utils/db'
import { createLogger } from '~/utils/logger'

const log = createLogger('user-store')

export const useUserStore = defineStore('user', () => {
  const employeeNumber = ref<string | null>(null)
  const retirementAge = ref<number>(65)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadPreferences() {
    loading.value = true
    error.value = null

    try {
      const [empPref, agePref] = await Promise.all([
        db.preferences.get('employeeNumber'),
        db.preferences.get('retirementAge'),
      ])

      employeeNumber.value = empPref ? empPref.value : null
      retirementAge.value = agePref ? Number(agePref.value) : 65

      log.debug('Preferences loaded', { employeeNumber: employeeNumber.value, retirementAge: retirementAge.value })
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load preferences'
      log.error('Failed to load preferences', { error: message })
      error.value = message
    }

    loading.value = false
  }

  async function savePreference(key: string, value: string) {
    await db.preferences.put({ key, value })

    if (key === 'employeeNumber') {
      employeeNumber.value = value
    }
    else if (key === 'retirementAge') {
      retirementAge.value = Number(value)
    }

    log.debug('Preference saved', { key, value })
  }

  async function getPreference(key: string): Promise<string | null> {
    const pref = await db.preferences.get(key)
    return pref?.value ?? null
  }

  async function clearPreferences() {
    await db.preferences.clear()
    employeeNumber.value = null
    retirementAge.value = 65
    error.value = null
    log.info('User preferences cleared')
  }

  return {
    employeeNumber,
    retirementAge,
    loading,
    error,
    loadPreferences,
    savePreference,
    getPreference,
    clearPreferences,
  }
})
