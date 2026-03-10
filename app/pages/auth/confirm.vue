<template>
  <div class="text-center">
    <template v-if="error">
      <UAlert
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        :title="errorTitle"
        :description="errorDescription"
        class="mb-4"
      />
      <UButton to="/auth/resend-email" variant="ghost">Resend confirmation email</UButton>
    </template>
    <div v-else class="flex items-center justify-center py-8">
      <UIcon name="i-lucide-loader-circle" class="animate-spin text-4xl text-primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Auth callback — handles both PKCE (query ?code=) and implicit flow (hash #access_token=).
// @supabase/ssr forces flowType: "pkce", so detectSessionInUrl only looks for ?code= in
// query params. Invites still use the implicit flow (tokens in hash), which the PKCE-mode
// client ignores. We explicitly parse the hash and call setSession() to bridge this gap.

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const errorCode = computed(() => {
  const hash = route.hash
  if (!hash.includes('error=')) return null
  const params = new URLSearchParams(hash.slice(1))
  return params.get('error_code')
})

const error = computed(() => !!errorCode.value)

const errorTitle = computed(() => {
  if (errorCode.value === 'otp_expired') return 'Confirmation link expired'
  return 'Confirmation failed'
})

const errorDescription = computed(() => {
  if (errorCode.value === 'otp_expired') return 'This link has expired. Request a new one below.'
  const hash = route.hash
  const params = new URLSearchParams(hash.slice(1))
  return params.get('error_description')?.replace(/\+/g, ' ') ?? 'Something went wrong.'
})

const hashType = computed(() => {
  const hash = route.hash
  if (!hash) return null
  const params = new URLSearchParams(hash.slice(1))
  return params.get('type')
})

// Explicitly set session from hash tokens (implicit flow: invites, magic links)
onMounted(async () => {
  const hash = route.hash
  if (!hash || !hash.includes('access_token')) return

  const params = new URLSearchParams(hash.slice(1))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }
})

watchEffect(() => {
  if (user.value) {
    const type = route.query.type || hashType.value
    navigateTo(type === 'recovery' || type === 'invite' ? '/auth/update-password' : '/')
  }
})
</script>
