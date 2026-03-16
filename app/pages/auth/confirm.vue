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
// Auth callback — handles PKCE flow (?code= query param) from password recovery emails.
// Invites use /auth/accept-invite instead (token_hash OTP flow).

definePageMeta({ layout: 'auth' })

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

watchEffect(() => {
  if (user.value) {
    const type = route.query.type as string | undefined
    navigateTo(type === 'recovery' ? '/auth/update-password' : '/dashboard')
  }
})
</script>
