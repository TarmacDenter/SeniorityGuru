<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Preferences</h2>
    </template>

    <UForm :schema="UpdatePreferencesSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="Mandatory Retirement Age" name="mandatoryRetirementAge" hint="Affects all seniority projections">
        <UInput v-model.number="state.mandatoryRetirementAge" type="number" :min="55" :max="75" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Save preferences</UButton>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { UpdatePreferencesSchema } from '#shared/schemas/settings'
import type { UpdatePreferencesState } from '#shared/schemas/settings'
import { useUserStore } from '~/stores/user'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const userStore = useUserStore()

const loading = ref(false)
const state = reactive<UpdatePreferencesState>({
  mandatoryRetirementAge: userStore.profile?.mandatory_retirement_age ?? 65,
})

async function onSave() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  loading.value = true
  const { error } = await supabase
    .from('profiles')
    .update({ mandatory_retirement_age: state.mandatoryRetirementAge })
    .eq('id', userId)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await userStore.fetchProfile()
  toast.add({ title: 'Preferences saved', color: 'success' })
}
</script>
