<script setup lang="ts">
import { useDemoBanner } from '~/composables/useDemoBanner'

const props = defineProps<{ compact?: boolean }>()
const emit = defineEmits<{ dismissed: [] }>()
const { showBanner, dismiss, exit } = useDemoBanner()

async function dismissBanner() {
  await dismiss()
  emit('dismissed')
}
</script>

<template>
  <div
    v-if="showBanner && props.compact"
    role="status"
    class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-default bg-elevated px-4 py-2 text-sm"
  >
    <UIcon name="i-lucide-flask-conical" class="size-4 shrink-0 text-muted" />
    <span class="font-medium text-highlighted">Demo mode</span>
    <span class="hidden text-muted sm:inline">Sample data only.</span>
    <span class="flex-1" />
    <UButton size="xs" color="neutral" variant="outline" to="/seniority/upload" icon="i-lucide-upload">Upload my list</UButton>
    <UButton size="xs" variant="ghost" color="neutral" @click="dismissBanner">Dismiss</UButton>
    <UButton size="xs" variant="ghost" color="neutral" @click="exit">Exit Demo</UButton>
  </div>
  <div v-else-if="showBanner" class="px-4 pt-4">
    <UAlert
      icon="i-lucide-flask-conical"
      color="info"
      variant="subtle"
      title="You're in demo mode"
      description="This is sample data from a fictional airline. Upload your own seniority list to see your real standing."
    >
      <template #actions>
        <UButton size="sm" color="primary" to="/seniority/upload" icon="i-lucide-upload">
          Upload my list
        </UButton>
        <UButton size="sm" variant="ghost" color="neutral" @click="dismissBanner">
          Dismiss
        </UButton>
        <UButton size="sm" variant="ghost" color="error" @click="exit">
          Exit Demo
        </UButton>
      </template>
    </UAlert>
  </div>
</template>
