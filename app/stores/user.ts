import { defineStore } from 'pinia'
import type { Tables } from '#shared/types/database'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('user-store')

export const useUserStore = defineStore('user', () => {
  // Called at setup time so the reactive ref is always accessible inside async
  // actions, regardless of Nuxt context propagation timing.
  const supabaseUser = useSupabaseUser()

  const profile = ref<Tables<'profiles'> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isModerator = computed(() => profile.value?.role === 'moderator' || profile.value?.role === 'admin')

  async function fetchProfile() {
    // useSupabaseUser() returns JWT claims — the user ID is in `sub`, not `id`
    const userId = supabaseUser.value?.sub as string | undefined
    if (!userId) return

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<Tables<'profiles'>>('/api/profile')
      log.debug('Profile loaded', { userId, airline: data?.icao_code })
      profile.value = data
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load profile'
      log.error('Profile fetch failed', { userId, error: message })
      error.value = message
    }

    loading.value = false
  }

  function clearProfile() {
    profile.value = null
    error.value = null
  }

  return { profile, loading, error, isAdmin, isModerator, fetchProfile, clearProfile }
})
