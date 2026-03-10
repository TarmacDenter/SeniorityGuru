import { useUserStore } from '~/stores/user'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('auth-sync')

/**
 * Keeps the Pinia user store in sync with Supabase auth state changes.
 *
 * Without this, session expiry, external sign-outs (other tabs), or token
 * refresh failures leave the cached profile in the store — causing the UI
 * to show stale role/permissions until a hard page refresh.
 */
export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const userStore = useUserStore()

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      log.info('Auth state: SIGNED_OUT — clearing cached profile')
      userStore.clearProfile()
    }

    if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
      log.debug('Auth state: refreshing profile', { event })
      userStore.fetchProfile()
    }
  })
})
