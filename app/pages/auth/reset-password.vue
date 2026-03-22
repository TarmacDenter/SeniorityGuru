<script setup lang="ts">
import { ResetPasswordSchema } from '#shared/schemas/auth'
import type { ResetPasswordState } from '#shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(false)

const state = reactive<ResetPasswordState>({ email: '' })

async function onSubmit() {
  loading.value = true
  await supabase.auth.resetPasswordForEmail(state.email)
  loading.value = false
  // Always navigate to confirm page to prevent email enumeration
  await navigateTo(`/auth/confirm?email=${encodeURIComponent(state.email)}&type=recovery`)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-center">Reset password</h1>

    <UForm :schema="ResetPasswordSchema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" />
      </UFormField>
      <UButton type="submit" class="w-full" :loading="loading">Send reset code</UButton>
    </UForm>

    <p class="mt-4 text-center text-sm">
      <ULink to="/auth/login" class="text-primary hover:underline">Back to sign in</ULink>
    </p>
  </div>
</template>
