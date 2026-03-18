<template>
  <div>
    <h1 class="text-2xl font-bold mb-2 text-center">Confirm your email</h1>
    <p class="text-center text-sm text-muted mb-6">Your email address hasn't been confirmed yet.</p>

    <template v-if="!sent">
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
        <UButton type="submit" class="w-full" :loading="loading">Resend confirmation email</UButton>
      </UForm>
    </template>

    <UAlert
      v-else
      icon="i-lucide-mail"
      color="success"
      variant="soft"
      title="Email sent"
      description="If an account exists for that address, we resent the confirmation link."
    />
    <p v-if="sent" class="mt-3 text-center text-sm text-muted">
      Don't see it? Check your junk or spam folder.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ResendEmailSchema } from '#shared/schemas/auth'
import type { ResendEmailState } from '#shared/schemas/auth'

// No auth middleware — unverified users are redirected here by the middleware.
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// If the user lands here with a confirmation token in the hash (redirect from GoTrue),
// the Supabase client will exchange it and update the user. Watch for that and redirect.
const redirected = ref(false)
watchEffect(async () => {
  if (redirected.value) return
  if (user.value?.user_metadata?.email_verified) {
    redirected.value = true
    await navigateTo('/dashboard')
  }
})
const loading = ref(false)
const sent = ref(false)

// Pre-fill email if the user is logged in but unverified
const prefilled = user.value?.email ?? ''
const state = reactive<ResendEmailState>({ email: prefilled })

async function onSubmit() {
  loading.value = true
  await supabase.auth.resend({
    type: 'signup',
    email: state.email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })
  loading.value = false
  // Always show success (anti-enumeration)
  sent.value = true
}
</script>
