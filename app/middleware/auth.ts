import { useUserStore } from '~/stores/user'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('auth-middleware')

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  // On client-only routes (ssr: false), the Supabase plugin populates
  // useSupabaseUser() in a page:start hook that fires AFTER middleware.
  // Fetch claims directly so the middleware doesn't redirect prematurely.
  if (!user.value && import.meta.client) {
    try {
      const client = useSupabaseClient()
      const { data } = await client.auth.getClaims()
      user.value = data?.claims ?? null
    } catch {
      // Supabase plugin not yet available (e.g. in test environment)
    }
  }

  // Level 1: not authenticated
  if (!user.value) {
    log.info('Unauthenticated access, redirecting to landing page', { path: to.path })
    return navigateTo('/')
  }

  // Level 2: authenticated but email not verified
  // useSupabaseUser() returns JWT claims — email_confirmed_at is NOT a JWT claim.
  // Use user_metadata.email_verified instead.
  const emailVerified = user.value.user_metadata?.email_verified
  if (!emailVerified && !to.path.startsWith('/auth/')) {
    log.info('Email not verified, redirecting', { path: to.path })
    return navigateTo('/auth/resend-email')
  }

  // Level 3: verified regular user with no airline selected
  // Admin users bypass this gate — they manage the system, not necessarily a pilot
  // Also skip for update-password and accept-invite — invited users set their password before their profile
  const setupExempt = ['/auth/setup-profile', '/auth/update-password', '/auth/accept-invite']
  if (emailVerified && !setupExempt.includes(to.path)) {
    const userStore = useUserStore()
    if (!userStore.profile) {
      await userStore.fetchProfile()
    }
    if (userStore.profile?.role !== 'admin' && !userStore.profile?.icao_code) {
      log.info('No airline set, redirecting to setup', { path: to.path })
      return navigateTo('/auth/setup-profile')
    }
  }
})
