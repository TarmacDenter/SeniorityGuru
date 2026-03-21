<script setup lang="ts">
import { LoginSchema } from '#shared/schemas/auth'
import type { LoginState } from '#shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const toast = useToast()
const loading = ref(false)

const state = reactive<LoginState>({
  email: '',
  password: '',
})

async function onSubmit() {
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword(state)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await navigateTo('/dashboard')
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-center">Sign in</h1>

    <UForm :schema="LoginSchema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" autocomplete="email" />
      </UFormField>
      <UFormField label="Password" name="password">
        <UInput v-model="state.password" type="password" class="w-full" autocomplete="current-password" />
      </UFormField>
      <UButton type="submit" class="w-full" :loading="loading">Sign in</UButton>
    </UForm>

    <div class="mt-4 text-center text-sm space-y-2">
      <div>
        <ULink to="/auth/reset-password" class="text-primary hover:underline">Forgot your password?</ULink>
      </div>

      <div class="text-muted">
        Don't have an account?
        <ULink to="/auth/signup" class="text-primary hover:underline">Sign up</ULink>
      </div>
    </div>
  </div>
</template>
