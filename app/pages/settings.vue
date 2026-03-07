<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold">Settings</h1>

    <!-- Profile -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Profile</h2>
      </template>

      <UForm :schema="UpdateProfileSchema" :state="profileState" class="space-y-4" @submit="onSaveProfile">
        <UFormField label="Airline" name="icaoCode">
          <USelectMenu
            v-model="profileState.icaoCode"
            :items="airlineOptions"
            value-key="value"
            placeholder="Search airlines..."
            :loading="airlinesLoading"
            :search-input="{ placeholder: 'Search by name...' }"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Employee Number" name="employeeNumber">
          <UInput v-model="profileState.employeeNumber" placeholder="e.g. 12345" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="profileLoading">Save profile</UButton>
      </UForm>
    </UCard>

    <!-- Preferences -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Preferences</h2>
      </template>

      <UForm :schema="UpdatePreferencesSchema" :state="prefsState" class="space-y-4" @submit="onSavePrefs">
        <UFormField label="Mandatory Retirement Age" name="mandatoryRetirementAge" hint="Affects all seniority projections">
          <UInput v-model.number="prefsState.mandatoryRetirementAge" type="number" :min="55" :max="75" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="prefsLoading">Save preferences</UButton>
      </UForm>
    </UCard>

    <!-- Security -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Security</h2>
      </template>

      <UForm :schema="ChangePasswordSchema" :state="passwordState" class="space-y-4" @submit="onChangePassword">
        <UFormField label="Current password" name="currentPassword">
          <UInput v-model="passwordState.currentPassword" type="password" class="w-full" />
        </UFormField>
        <UFormField label="New password" name="password">
          <UInput v-model="passwordState.password" type="password" class="w-full" />
        </UFormField>
        <UFormField label="Confirm new password" name="confirmPassword">
          <UInput v-model="passwordState.confirmPassword" type="password" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="passwordLoading">Change password</UButton>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { UpdateProfileSchema, UpdatePreferencesSchema, ChangePasswordSchema } from '#shared/schemas/settings'
import type { UpdateProfileState, UpdatePreferencesState, ChangePasswordState } from '#shared/schemas/settings'
import { normalizeEmployeeNumber } from '#shared/schemas/seniority-list'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: 'seniority', middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const userStore = useUserStore()

// Load airline options
const { options: airlineOptions, loading: airlinesLoading, load: loadAirlines } = useAirlineOptions()
await loadAirlines()

// --- Profile form ---
const profileLoading = ref(false)
const profileState = reactive<UpdateProfileState>({
  icaoCode: userStore.profile?.icao_code ?? '',
  employeeNumber: userStore.profile?.employee_number ?? '',
})

async function onSaveProfile() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  profileLoading.value = true
  const normalized = profileState.employeeNumber
    ? normalizeEmployeeNumber(profileState.employeeNumber)
    : ''
  const { error } = await supabase
    .from('profiles')
    .update({
      icao_code: profileState.icaoCode,
      employee_number: normalized || null,
    })
    .eq('id', userId)
  profileLoading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await userStore.fetchProfile()
  toast.add({ title: 'Profile saved', color: 'success' })
}

// --- Preferences form ---
const prefsLoading = ref(false)
const prefsState = reactive<UpdatePreferencesState>({
  mandatoryRetirementAge: userStore.profile?.mandatory_retirement_age ?? 65,
})

async function onSavePrefs() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  prefsLoading.value = true
  const { error } = await supabase
    .from('profiles')
    .update({ mandatory_retirement_age: prefsState.mandatoryRetirementAge })
    .eq('id', userId)
  prefsLoading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await userStore.fetchProfile()
  toast.add({ title: 'Preferences saved', color: 'success' })
}

// --- Password form ---
const passwordLoading = ref(false)
const passwordState = reactive<ChangePasswordState>({
  currentPassword: '',
  password: '',
  confirmPassword: '',
})

async function onChangePassword() {
  const email = user.value?.email
  if (!email) return

  passwordLoading.value = true

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: passwordState.currentPassword,
  })

  if (signInError) {
    passwordLoading.value = false
    toast.add({ title: 'Current password is incorrect', color: 'error' })
    return
  }

  // Update to new password
  const { error } = await supabase.auth.updateUser({ password: passwordState.password })
  passwordLoading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  passwordState.currentPassword = ''
  passwordState.password = ''
  passwordState.confirmPassword = ''
  toast.add({ title: 'Password changed', color: 'success' })
}
</script>
