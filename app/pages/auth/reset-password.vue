<script setup lang="ts">
import { ResetPasswordSchema } from '#shared/schemas/auth'
import type { ResetPasswordState } from '#shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(false)
const sent = ref(false)

const state = reactive<ResetPasswordState>({ email: '' })

async function onSubmit() {
  loading.value = true
  await supabase.auth.resetPasswordForEmail(state.email, {
    redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
  })
  loading.value = false
  // Always show success to prevent email enumeration
  sent.value = true
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-center">Reset password</h1>

    <template v-if="!sent">
      <UForm :schema="ResetPasswordSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" />
        </UFormField>
        <UButton type="submit" class="w-full" :loading="loading">Send reset link</UButton>
      </UForm>
    </template>

    <UAlert
      v-else
      icon="i-lucide-mail"
      color="success"
      variant="soft"
      title="Check your email"
      description="If an account exists for that address, we sent a password reset link."
    />
    <p v-if="sent" class="mt-3 text-center text-sm text-muted">
      Don't see it? Check your junk or spam folder.
    </p>

    <p class="mt-4 text-center text-sm">
      <ULink to="/auth/login" class="text-primary hover:underline">Back to sign in</ULink>
    </p>
  </div>
</template>
