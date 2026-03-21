<script setup lang="ts">
import { SignUpSchema } from '#shared/schemas/auth'
import type { SignUpState } from '#shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const toast = useToast()
const loading = ref(false)
const successEmail = ref<string | null>(null)

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

  successEmail.value = state.email
}

</script>

<template>
  <div>
    <template v-if="successEmail">
      <div class="text-center space-y-3">
        <UIcon name="i-lucide-mail-check" class="size-12 text-primary mx-auto" />
        <h1 class="text-2xl font-bold">Check your email</h1>
        <p class="text-muted text-sm">
          We sent a confirmation link to <span class="font-medium text-default">{{ successEmail }}</span>.
          Click it to activate your account.
        </p>
        <p class="text-xs text-muted">
          Can't find it? Check your spam folder.
        </p>
      </div>
    </template>

    <template v-else>
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
    </template>
  </div>
</template>
