<script setup lang="ts">
import { normalizeEmployeeNumber } from '#shared/schemas/seniority-list'
import { useUserStore } from '~/stores/user'

const emit = defineEmits<{
  saved: []
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const employeeNumber = ref('')
const loading = ref(false)
const validationError = ref('')

async function onSave() {
  const trimmed = employeeNumber.value.trim()
  if (!trimmed) {
    validationError.value = 'Employee number is required'
    return
  }
  if (trimmed.length > 20) {
    validationError.value = 'Employee number is too long'
    return
  }
  validationError.value = ''

  const userId = user.value?.sub as string | undefined
  if (!userId) return

  const normalized = normalizeEmployeeNumber(trimmed)

  loading.value = true
  const { error } = await supabase
    .from('profiles')
    .update({ employee_number: normalized })
    .eq('id', userId)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  const userStore = useUserStore()

  // Optimistically update the store so the dashboard reacts immediately.
  // fetchProfile() syncs the full profile from the server; if it fails the
  // optimistic value ensures the employee number is still visible.
  if (userStore.profile) {
    userStore.profile = { ...userStore.profile, employee_number: normalized }
  }
  await userStore.fetchProfile()

  toast.add({ title: 'Employee number saved', color: 'success' })
  emit('saved')
}
</script>

<template>
  <UCard
    variant="outline"
    :ui="{
      root: 'border-l-4 border-l-(--ui-primary)',
    }"
  >
    <div class="flex items-start gap-4">
      <UIcon name="i-lucide-id-card" class="size-8 text-primary shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0">
        <p class="text-base font-semibold text-highlighted">Enter Your Employee Number</p>
        <p class="text-sm text-muted mt-1">
          Set your employee number to see your personal seniority data, projections, and rank across bases.
        </p>
        <form class="flex items-start gap-2 mt-3" @submit.prevent="onSave">
          <UInput
            v-model="employeeNumber"
            placeholder="e.g. 12345"
            :color="validationError ? 'error' : undefined"
          />
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            label="Save"
          />
        </form>
        <p v-if="validationError" class="text-sm text-error mt-1">{{ validationError }}</p>
      </div>
    </div>
  </UCard>
</template>
