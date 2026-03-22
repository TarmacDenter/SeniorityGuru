<script setup lang="ts">
import { ResendEmailSchema } from '#shared/schemas/auth'
import type { ResendEmailState } from '#shared/schemas/auth'

// No auth middleware — unverified users are redirected here by the middleware.
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(false)
const rateLimited = ref(false)

const prefilled = user.value?.email ?? ''
const state = reactive<ResendEmailState>({ email: prefilled })

async function onSubmit() {
  loading.value = true
  rateLimited.value = false

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: state.email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })

  loading.value = false

  // Surface rate-limit errors so users know to wait rather than keep retrying
  if (error?.code === 'over_email_otp_max_frequency') {
    rateLimited.value = true
    return
  }

  // Anti-enumeration: navigate regardless of all other outcomes
  // (including "email not found" — we don't reveal whether an account exists)
  await navigateTo(`/auth/confirm?email=${encodeURIComponent(state.email)}`)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-2 text-center">Confirm your email</h1>
    <p class="text-center text-sm text-muted mb-6">Your email address hasn't been confirmed yet.</p>

    <UForm :schema="ResendEmailSchema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="you@example.com"
          class="w-full"
          :disabled="!!prefilled"
        />
      </UFormField>

      <UAlert
        v-if="rateLimited"
        icon="i-lucide-clock"
        color="warning"
        variant="soft"
        title="Too many attempts"
        description="Please wait a moment before requesting another code."
        class="mt-2"
      />

      <UButton type="submit" class="w-full" :loading="loading">Send confirmation code</UButton>
    </UForm>
  </div>
</template>
