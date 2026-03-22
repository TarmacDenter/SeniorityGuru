<script setup lang="ts">
import { ConfirmEmailSchema } from '#shared/schemas/auth'
import type { ConfirmEmailState } from '#shared/schemas/auth'

// Handles two OTP-based flows:
// 1. Signup confirmation — user enters 6-digit code from signup email (type: 'email')
// 2. Recovery confirmation — user enters 6-digit code from recovery email (type: 'recovery')

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const route = useRoute()

const isRecovery = route.query.type === 'recovery'

const state = reactive<ConfirmEmailState>({
  email: (route.query.email as string) ?? '',
  token: '',
})
const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  loading.value = true
  error.value = null

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: state.email,
    token: state.token,
    type: isRecovery ? 'recovery' : 'email',
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

  if (isRecovery) {
    await navigateTo('/auth/update-password')
  }
  else {
    await navigateTo('/dashboard')
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-2 text-center">
      {{ isRecovery ? 'Reset your password' : 'Confirm your email' }}
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
      <UFormField :label="isRecovery ? 'Recovery code' : 'Confirmation code'" name="token">
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
        {{ isRecovery ? 'Verify code' : 'Confirm email' }}
      </UButton>
    </UForm>

    <p class="mt-4 text-center text-sm text-muted">
      <template v-if="isRecovery">
        Didn't receive a code?
        <ULink to="/auth/reset-password" class="text-primary hover:underline">Request a new code</ULink>
      </template>
      <template v-else>
        Didn't receive a code?
        <ULink to="/auth/resend-email" class="text-primary hover:underline">Resend</ULink>
      </template>
    </p>
  </div>
</template>
