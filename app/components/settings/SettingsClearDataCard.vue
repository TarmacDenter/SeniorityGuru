<script setup lang="ts">
import { useClearAllData } from '~/composables/useClearAllData'

const toast = useToast()
const confirm = ref(false)
const loading = ref(false)

const { clearAllData } = useClearAllData()

async function clearAll() {
  loading.value = true
  await clearAllData()
  loading.value = false
  confirm.value = false
  toast.add({ title: 'All local data cleared', color: 'success' })
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-error">Clear All Data</h2>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-muted">
        Permanently deletes all imported seniority lists, entries, and preferences from this device.
        This cannot be undone.
      </p>

      <div v-if="!confirm">
        <UButton color="error" variant="outline" @click="confirm = true">
          Clear all data
        </UButton>
      </div>

      <div v-else class="flex items-center gap-3">
        <p class="text-sm font-medium text-error">Are you sure?</p>
        <UButton color="error" :loading="loading" @click="clearAll">
          Yes, clear everything
        </UButton>
        <UButton variant="ghost" @click="confirm = false">
          Cancel
        </UButton>
      </div>
    </div>
  </UCard>
</template>
