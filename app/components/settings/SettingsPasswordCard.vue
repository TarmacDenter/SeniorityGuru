<script setup lang="ts">
import { ChangePasswordSchema } from '#shared/schemas/settings'
import type { ChangePasswordState } from '#shared/schemas/settings'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const loading = ref(false)
const state = reactive<ChangePasswordState>({
  currentPassword: '',
  password: '',
  confirmPassword: '',
})

async function onSave() {
  const email = user.value?.email
  if (!email) return

  loading.value = true

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: state.currentPassword,
  })

  if (signInError) {
    loading.value = false
    toast.add({ title: 'Current password is incorrect', color: 'error' })
    return
  }

  const { error } = await supabase.auth.updateUser({ password: state.password })
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  state.currentPassword = ''
  state.password = ''
  state.confirmPassword = ''
  toast.add({ title: 'Password changed', color: 'success' })
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Password</h2>
    </template>

    <UForm :schema="ChangePasswordSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="Current password" name="currentPassword">
        <UInput v-model="state.currentPassword" type="password" class="w-full" />
      </UFormField>
      <UFormField label="New password" name="password">
        <UInput v-model="state.password" type="password" class="w-full" />
      </UFormField>
      <UFormField label="Confirm new password" name="confirmPassword">
        <UInput v-model="state.confirmPassword" type="password" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Change password</UButton>
    </UForm>
  </UCard>
</template>
