<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-center">Create account</h1>

    <template v-if="!success">
      <UForm :schema="SignUpSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" />
        </UFormField>
        <UFormField label="Password" name="password">
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>
        <UFormField label="Confirm password" name="confirmPassword">
          <UInput v-model="state.confirmPassword" type="password" class="w-full" />
        </UFormField>
        <UFormField label="Airline (optional)" name="icaoCode" hint="You can set this after confirming your email">
          <USelectMenu
            v-model="state.icaoCode"
            :items="airlineOptions"
            value-key="value"
            placeholder="Search airlines..."
            :loading="airlinesLoading"
            :search-input="{ placeholder: 'Search by name...' }"
            class="w-full"
          />
        </UFormField>
        <UButton type="submit" class="w-full" :loading="loading">Create account</UButton>
      </UForm>
      <p class="mt-4 text-center text-sm text-muted">
        Already have an account?
        <ULink to="/auth/login" class="text-primary hover:underline">Sign in</ULink>
      </p>
    </template>

    <UAlert
      v-else
      icon="i-lucide-mail"
      color="success"
      variant="soft"
      title="Check your email"
      description="We sent a confirmation link to your email address. Click the link to activate your account."
    />
  </div>
</template>

<script setup lang="ts">
import { SignUpSchema } from '#shared/schemas/auth'
import type { SignUpState } from '#shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const toast = useToast()
const loading = ref(false)
const success = ref(false)

const state = reactive<SignUpState>({
  email: '',
  password: '',
  confirmPassword: '',
  icaoCode: undefined,
})

const { options: airlineOptions, loading: airlinesLoading, load: loadAirlines } = useAirlineOptions()
await loadAirlines()

async function onSubmit() {
  loading.value = true
  const { error } = await supabase.auth.signUp({
    email: state.email,
    password: state.password,
    options: {
      data: { icao_code: state.icaoCode || null },
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  success.value = true
}
</script>
