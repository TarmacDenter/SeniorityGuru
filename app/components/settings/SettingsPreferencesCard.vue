<script setup lang="ts">
import { z } from 'zod'

const UpdatePreferencesSchema = z.object({
  mandatoryRetirementAge: z.number().int('Must be a whole number').min(55, 'Minimum age is 55').max(75, 'Maximum age is 75'),
})
type UpdatePreferencesState = z.infer<typeof UpdatePreferencesSchema>

const { retirementAge, savePreference } = useUser()
const toast = useToast()

const loading = ref(false)
const state = reactive<UpdatePreferencesState>({
  mandatoryRetirementAge: retirementAge.value,
})

async function onSave() {
  loading.value = true
  const { error } = await savePreference('retirementAge', String(state.mandatoryRetirementAge))
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  toast.add({ title: 'Preferences saved', color: 'success' })
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Preferences</h2>
    </template>

    <UForm :schema="UpdatePreferencesSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="Mandatory Retirement Age" name="mandatoryRetirementAge">
        <UInput v-model="state.mandatoryRetirementAge" type="number" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Save preferences</UButton>
    </UForm>
  </UCard>
</template>
