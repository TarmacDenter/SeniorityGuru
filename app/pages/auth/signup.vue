<script setup lang="ts">
import { SignUpSchema } from '#shared/schemas/auth'
import type { SignUpState } from '#shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const toast = useToast()
const loading = ref(false)

const state = reactive<Omit<SignUpState, 'icaoCode'>>({
  email: '',
  password: '',
  confirmPassword: '',
})

async function onSubmit() {
  loading.value = true
  const { error } = await supabase.auth.signUp({
    email: state.email,
    password: state.password,
    options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
  })
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await navigateTo(`/auth/confirm?email=${encodeURIComponent(state.email)}`)
}

</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-center">Create your account</h1>

    <UForm :schema="SignUpSchema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" autocomplete="email" />
      </UFormField>
      <UFormField label="Password" name="password">
        <UInput v-model="state.password" type="password" class="w-full" autocomplete="new-password" />
      </UFormField>
      <UFormField label="Confirm password" name="confirmPassword">
        <UInput v-model="state.confirmPassword" type="password" class="w-full" autocomplete="new-password" />
      </UFormField>
      <UButton type="submit" class="w-full" :loading="loading">Create account</UButton>
    </UForm>

    <p class="mt-4 text-center text-sm text-muted">
      Already have an account?
      <ULink to="/auth/login" class="text-primary hover:underline">Sign in</ULink>
    </p>
  </div>
</template>
