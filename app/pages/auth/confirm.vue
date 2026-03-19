<template>
  <div class="text-center">
    <template v-if="errorCode">
      <UAlert
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        :title="errorTitle"
        :description="errorDescription"
        class="mb-4"
      />
      <UButton :to="isRecovery ? '/auth/reset-password' : '/auth/resend-email'" variant="ghost">
        {{ isRecovery ? 'Request a new reset link' : 'Resend confirmation email' }}
      </UButton>
    </template>
    <div v-else class="flex items-center justify-center py-8">
      <UIcon name="i-lucide-loader-circle" class="animate-spin text-4xl text-primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Auth callback — handles PKCE flow (?code= query param) from email confirmations
// and password recovery emails. Invites use /auth/accept-invite instead (token_hash OTP flow).
//
// Recovery emails deliver tokens in the URL hash (implicit flow). The PKCE-mode Supabase
// client ignores hash tokens, so we exchange them explicitly in onMounted.
// All hash-reading is client-only (hash is unavailable on SSR) to prevent hydration mismatches.

definePageMeta({ layout: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

// errorCode is null until onMounted reads the hash — SSR always renders the spinner.
const errorCode = ref<string | undefined>(undefined)
const errorDescription = ref<string | undefined>(undefined)

const errorTitle = computed(() => {
  if (errorCode.value === 'otp_expired') return 'Confirmation link expired'
  return 'Confirmation failed'
})

// Primary signal: ?type=recovery query param (available on SSR, no hydration risk).
// Fallback: PASSWORD_RECOVERY auth event fires after successful token exchange.
const isRecovery = ref(route.query.type === 'recovery')

const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    isRecovery.value = true
  }
})

onBeforeUnmount(() => {
  subscription.unsubscribe()
})

// All hash-reading happens here — hash is client-only and unavailable during SSR.
onMounted(async () => {
  const hash = route.hash
  if (!hash) return

  const params = new URLSearchParams(hash.slice(1))

  if (params.has('error')) {
    errorCode.value = params.get('error_code') ?? undefined
    const raw = params.get('error_description')
    errorDescription.value = raw?.replace(/\+/g, ' ') ?? 'Something went wrong.'
    return
  }

  // Recovery emails use implicit flow: tokens arrive in the hash.
  // Exchange them for a session so the watchEffect below can navigate.
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  }
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
    <template v-if="errorCode">
      <UAlert
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        :title="errorTitle"
        :description="errorDescription"
        class="mb-4"
      />
      <UButton :to="isRecovery ? '/auth/reset-password' : '/auth/resend-email'" variant="ghost">
        {{ isRecovery ? 'Request a new reset link' : 'Resend confirmation email' }}
      </UButton>
    </template>
    <div v-else class="flex items-center justify-center py-8">
      <UIcon name="i-lucide-loader-circle" class="animate-spin text-4xl text-primary" />
    </div>
  </div>
</template>
