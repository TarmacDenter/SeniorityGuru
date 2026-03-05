import { useUserStore } from '~/stores/user'

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
    return navigateTo('/auth/login')
  }

  // Level 2: authenticated but email not verified
  // useSupabaseUser() returns JWT claims — email_confirmed_at is NOT a JWT claim.
  // Use user_metadata.email_verified instead.
  const emailVerified = user.value.user_metadata?.email_verified
  if (!emailVerified && !to.path.startsWith('/auth/')) {
    return navigateTo('/auth/resend-email')
  }

  // Level 3: verified regular user with no airline selected
  // Admin users bypass this gate — they manage the system, not necessarily a pilot
  if (emailVerified && to.path !== '/auth/setup-profile') {
    const userStore = useUserStore()
    if (!userStore.profile) {
      await userStore.fetchProfile()
    }
    if (userStore.profile?.role !== 'admin' && !userStore.profile?.icao_code) {
      return navigateTo('/auth/setup-profile')
    }
  }
})
