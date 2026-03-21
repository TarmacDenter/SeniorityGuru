<script setup lang="ts">
import { ConfirmEmailSchema } from '#shared/schemas/auth'
import type { ConfirmEmailState } from '#shared/schemas/auth'

// Handles two cases:
// 1. Signup OTP confirmation — user enters 6-digit code from email
// 2. Password recovery passthrough — hash contains access_token, exchange it and redirect
//    (Recovery uses implicit flow; tokens arrive in the URL hash, unavailable during SSR)

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const route = useRoute()

const state = reactive<ConfirmEmailState>({
  email: (route.query.email as string) ?? '',
  token: '',
})
const loading = ref(false)
const error = ref<string | null>(null)

// Hash-based errors (from recovery email redirects gone wrong)
const errorCode = ref<string | undefined>(undefined)
const errorDescription = ref<string | undefined>(undefined)
const errorTitle = computed(() => {
  if (errorCode.value === 'otp_expired') return 'Link expired'
  return 'Confirmation failed'
})

// Recovery passthrough detection
const isRecovery = ref(route.query.type === 'recovery')

const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    isRecovery.value = true
  }
})

onBeforeUnmount(() => {
  subscription.unsubscribe()
})

// All hash-reading is client-only — hash is unavailable during SSR.
// If this is a recovery link, exchange the tokens and redirect silently.
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

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    await navigateTo('/auth/update-password')
  }
})

async function onSubmit() {
  loading.value = true
  error.value = null

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: state.email,
    token: state.token,
    type: 'signup',
  })

  loading.value = false

  if (verifyError) {
    const msg = verifyError.message.toLowerCase()
    if (msg.includes('expired') || msg.includes('otp') || msg.includes('invalid')) {
      error.value = 'This code has expired or is invalid. Please request a new one.'
    }
    else {
      error.value = verifyError.message
    }
    return
  }

  await navigateTo('/dashboard')
}
</script>

<template>
  <div>
    <!-- Hash-based error (broken recovery link etc.) -->
    <template v-if="errorCode">
      <UAlert
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        :title="errorTitle"
        :description="errorDescription"
        class="mb-4"
      />
      <UButton to="/auth/resend-email" variant="ghost">
        Resend confirmation email
      </UButton>
    </template>

    <!-- Recovery passthrough: spinner while setSession + navigateTo runs -->
    <template v-else-if="isRecovery">
      <div class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="animate-spin text-4xl text-primary" />
      </div>
    </template>

    <!-- Default: OTP input form -->
    <template v-else>
      <h1 class="text-2xl font-bold mb-2 text-center">
        Confirm your email
      </h1>
      <p class="text-sm text-muted text-center mb-6">
        Enter the 6-digit code we sent to
        <span v-if="state.email" class="font-medium text-default">{{ state.email }}</span
        ><span v-else>your email address</span>.
      </p>

      <UForm :schema="ConfirmEmailSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="you@example.com"
            class="w-full"
            :disabled="!!(route.query.email as string)"
          />
        </UFormField>
        <UFormField label="Confirmation code" name="token">
          <UInput
            v-model="state.token"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            class="w-full font-mono text-center text-xl tracking-widest"
          />
        </UFormField>

        <UAlert
          v-if="error"
          icon="i-lucide-alert-circle"
          color="error"
          variant="soft"
          :title="error"
          class="mt-2"
        />

        <UButton type="submit" class="w-full" :loading="loading">
          Confirm email
        </UButton>
      </UForm>

      <p class="mt-4 text-center text-sm text-muted">
        Didn't receive a code?
        <ULink to="/auth/resend-email" class="text-primary hover:underline">Resend</ULink>
      </p>
    </template>
  </div>
</template>
