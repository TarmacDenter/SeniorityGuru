<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-center">Set new password</h1>

    <UForm :schema="RecoveryPasswordSchema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="New password" name="password">
        <UInput v-model="state.password" type="password" class="w-full" />
      </UFormField>
      <UFormField label="Confirm password" name="confirmPassword">
        <UInput v-model="state.confirmPassword" type="password" class="w-full" />
      </UFormField>
      <UButton type="submit" class="w-full" :loading="loading">Update password</UButton>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { RecoveryPasswordSchema } from '#shared/schemas/auth'
import type { RecoveryPasswordState } from '#shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const loading = ref(false)

onMounted(() => {
  if (!user.value) {
    navigateTo('/auth/reset-password')
  }
})

const state = reactive<RecoveryPasswordState>({
  password: '',
  confirmPassword: '',
})

async function onSubmit() {
  loading.value = true
  const { error } = await supabase.auth.updateUser({ password: state.password })
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  toast.add({ title: 'Password updated successfully', color: 'success' })
  navigateTo('/')
}
</script>
