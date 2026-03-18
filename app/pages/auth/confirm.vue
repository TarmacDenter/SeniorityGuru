<script setup lang="ts">
// Auth callback — handles PKCE flow (?code= query param) from email confirmations
// and password recovery emails. Invites use /auth/accept-invite instead (token_hash OTP flow).

definePageMeta({ layout: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
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

// Track whether this is a password recovery flow.
// Primary signal: ?type=recovery query param set by resetPasswordForEmail redirectTo.
// Fallback: Supabase PASSWORD_RECOVERY auth event (fires when recovery token is exchanged).
const isRecovery = ref(route.query.type === 'recovery')

const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    isRecovery.value = true
  }
})

onBeforeUnmount(() => {
  subscription.unsubscribe()
})

const redirected = ref(false)
watchEffect(async () => {
  if (redirected.value) return
  if (user.value) {
    redirected.value = true
    await navigateTo(isRecovery.value ? '/auth/update-password' : '/dashboard')
  }
})
</script>

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
