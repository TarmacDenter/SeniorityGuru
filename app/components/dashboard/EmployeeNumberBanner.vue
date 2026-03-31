<script setup lang="ts">
import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'

const emit = defineEmits<{
  saved: []
}>()

const { savePreference } = useUser()
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

  const normalized = normalizeEmployeeNumber(trimmed)

  loading.value = true
  const { error } = await savePreference('employeeNumber', normalized)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  toast.add({ title: 'Employee number saved', color: 'success' })
  emit('saved')
}
</script>

<template>
  <UCard variant="accent">
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
            :color="validationError ? 'error' : 'primary'"
            :highlight="!!validationError"
          />
          <UButton
            type="submit"
            size="sm"
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
