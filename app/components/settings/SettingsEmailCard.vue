<script setup lang="ts">
import { ChangeEmailSchema } from '#shared/schemas/settings'
import type { ChangeEmailState } from '#shared/schemas/settings'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const loading = ref(false)
const state = reactive<ChangeEmailState>({ newEmail: '' })

async function onSave() {
  loading.value = true
  const { error } = await supabase.auth.updateUser({ email: state.newEmail })
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  state.newEmail = ''
  toast.add({ title: 'Confirmation link sent to your new email address', color: 'success' })
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Email</h2>
    </template>

    <p class="text-sm text-muted mb-4">Current email: <strong>{{ user?.email }}</strong></p>

    <UForm :schema="ChangeEmailSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="New email address" name="newEmail">
        <UInput v-model="state.newEmail" type="email" placeholder="new@example.com" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Update email</UButton>
    </UForm>
  </UCard>
</template>
