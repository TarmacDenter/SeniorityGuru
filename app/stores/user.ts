import { defineStore } from 'pinia'
import { db } from '~/utils/db'
import { createLogger } from '~/utils/logger'
import { PREFERENCE_SERIALIZERS, PREFERENCE_DESERIALIZERS } from '~/utils/preferences'
import type { PreferenceMap } from '~/utils/preferences'
import { emitHook } from '~/utils/hooks'
import { canonicalizeEmployeeNumber } from '~/utils/schemas/seniority-list'

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

      employeeNumber.value = empPref ? canonicalizeEmployeeNumber(empPref.value) : null
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

  async function savePreference<K extends keyof PreferenceMap>(key: K, value: PreferenceMap[K]): Promise<void> {
    const serialized = PREFERENCE_SERIALIZERS[key](value)
    await db.preferences.put({ key, value: serialized })

    if (key === 'employeeNumber') {
      employeeNumber.value = canonicalizeEmployeeNumber(value as string)
    }
    else if (key === 'retirementAge') {
      retirementAge.value = value as number
    }

    log.debug('Preference saved', { key, value: serialized })
    emitHook('user:preference:changed', key as string).catch((e: unknown) => {
      log.warn('emitHook user:preference:changed failed', { error: String(e) })
    })
  }

  async function getPreference<K extends keyof PreferenceMap>(key: K): Promise<PreferenceMap[K] | null> {
    const pref = await db.preferences.get(key as string)
    if (!pref) return null
    return PREFERENCE_DESERIALIZERS[key](pref.value)
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
