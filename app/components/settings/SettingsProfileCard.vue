<script setup lang="ts">
import { UpdateProfileSchema } from '#shared/schemas/settings'
import type { UpdateProfileState } from '#shared/schemas/settings'
import { normalizeEmployeeNumber } from '#shared/schemas/seniority-list'
import { useUserStore } from '~/stores/user'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const userStore = useUserStore()

const { options: airlineOptions, loading: airlinesLoading, load: loadAirlines } = useAirlineOptions()
await loadAirlines()

const loading = ref(false)
const state = reactive<UpdateProfileState>({
  icaoCode: userStore.profile?.icao_code ?? '',
  employeeNumber: userStore.profile?.employee_number ?? '',
})

async function onSave() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  loading.value = true
  const normalized = state.employeeNumber ? normalizeEmployeeNumber(state.employeeNumber) : ''
  const { error } = await supabase
    .from('profiles')
    .update({ icao_code: state.icaoCode, employee_number: normalized || null })
    .eq('id', userId)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  if (userStore.profile) {
    userStore.profile = {
      ...userStore.profile,
      icao_code: state.icaoCode,
      employee_number: normalized || null,
    }
  }
  await userStore.fetchProfile()
  toast.add({ title: 'Profile saved', color: 'success' })
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Profile</h2>
    </template>

    <UForm :schema="UpdateProfileSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="Airline" name="icaoCode">
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
      <UFormField label="Employee Number" name="employeeNumber">
        <UInput v-model="state.employeeNumber" placeholder="e.g. 12345" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Save profile</UButton>
    </UForm>
  </UCard>
</template>
