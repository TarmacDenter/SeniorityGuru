import { defineStore } from 'pinia'
import type { Tables } from '#shared/types/database'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('user-store')

export const useUserStore = defineStore('user', () => {
  const profile = ref<Tables<'profiles'> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isModerator = computed(() => profile.value?.role === 'moderator' || profile.value?.role === 'admin')

  async function fetchProfile() {
    const db = useDb()
    const user = useSupabaseUser()

    // useSupabaseUser() returns JWT claims — the user ID is in `sub`, not `id`
    const userId = user.value?.sub as string | undefined
    if (!userId) return

    loading.value = true
    error.value = null

    const { data, error: dbError } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (dbError) {
      log.error('Profile fetch failed', { userId, error: dbError.message })
      error.value = dbError.message
    } else {
      log.debug('Profile loaded', { userId, airline: data?.icao_code })
      profile.value = data
    }

    loading.value = false
  }

  function clearProfile() {
    profile.value = null
    error.value = null
  }

  return { profile, loading, error, isAdmin, isModerator, fetchProfile, clearProfile }
})
