<script setup lang="ts">
import { AcceptInviteSchema } from '#shared/schemas/auth'
import type { AcceptInviteState } from '#shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const route = useRoute()

const loading = ref(false)
const verified = ref(false)
const error = ref<string | null>(null)

const state = reactive<AcceptInviteState>({
  email: (route.query.email as string) ?? '',
  token: '',
})

defineExpose({ state, onSubmit })

async function onSubmit() {
  loading.value = true
  error.value = null

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: state.email,
    token: state.token,
    type: 'invite',
  })

  loading.value = false

  if (verifyError) {
    if (verifyError.message.toLowerCase().includes('expired') || verifyError.message.toLowerCase().includes('otp')) {
      error.value = 'This code has expired or is invalid. Please request a new invitation.'
    } else {
      error.value = verifyError.message
    }
    return
  }

  verified.value = true
  navigateTo('/auth/update-password')
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-2 text-center">Accept your invitation</h1>
    <p class="text-sm text-muted text-center mb-6">Enter the 6-digit code from your invitation email.</p>

    <template v-if="!verified">
      <UForm :schema="AcceptInviteSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" />
        </UFormField>
        <UFormField label="Invitation code" name="token">
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
        <UButton type="submit" class="w-full" :loading="loading">Verify &amp; continue</UButton>
      </UForm>
    </template>
  </div>
</template>
