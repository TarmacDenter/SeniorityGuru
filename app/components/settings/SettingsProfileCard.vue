<script setup lang="ts">
import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'

const { employeeNumber: currentEmployeeNumber, savePreference } = useUser()
const toast = useToast()

const loading = ref(false)
const employeeNumberInput = ref(currentEmployeeNumber.value ?? '')

async function onSave() {
  loading.value = true
  const normalized = employeeNumberInput.value ? normalizeEmployeeNumber(employeeNumberInput.value.trim()) : ''
  const { error } = await savePreference('employeeNumber', normalized)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  toast.add({ title: 'Profile saved', color: 'success' })
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Profile</h2>
    </template>

    <UForm :state="{ employeeNumber: employeeNumberInput }" class="space-y-4" @submit="onSave">
      <UFormField label="Employee Number" name="employeeNumber">
        <UInput v-model="employeeNumberInput" placeholder="e.g. 12345" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Save profile</UButton>
    </UForm>
  </UCard>
</template>
