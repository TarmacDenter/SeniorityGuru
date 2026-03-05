<template>
  <div>
    <h1 class="text-2xl font-bold mb-2 text-center">Select your airline</h1>
    <p class="text-center text-sm text-muted mb-6">Choose your airline to access SeniorityGuru.</p>

    <UForm :schema="SetupProfileSchema" :state="state" class="space-y-4" @submit="onSubmit">
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
      <UButton type="submit" class="w-full" :loading="loading">Continue</UButton>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { SetupProfileSchema } from '#shared/schemas/auth'
import type { SetupProfileState } from '#shared/schemas/auth'
import { useUserStore } from '~/stores/user'

// No auth middleware — middleware redirects HERE; applying it would create a loop.
// Auth is enforced implicitly: the profile update requires an authenticated session via RLS.
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const loading = ref(false)

const state = reactive<SetupProfileState>({
  icaoCode: '',
})

const { options: airlineOptions, loading: airlinesLoading, load: loadAirlines } = useAirlineOptions()
await loadAirlines()

async function onSubmit() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  loading.value = true
  const { error } = await supabase
    .from('profiles')
    .update({ icao_code: state.icaoCode })
    .eq('id', userId)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  // Refresh the user store so middleware doesn't gate on the next nav
  const userStore = useUserStore()
  await userStore.fetchProfile()

  navigateTo('/')
}
</script>
