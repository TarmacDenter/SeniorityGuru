<script setup lang="ts">
// The List section's only control: which Seniority List to read, with its Demo and Historical badges.
const selectedListId = defineModel<number | undefined>('selectedListId')

defineProps<{
  listOptions: { id: number | undefined; label: string; isLatest: boolean }[]
  isDemo: boolean
  isHistorical: boolean
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-default px-4 sm:px-6 py-3">
    <USelectMenu
      v-if="listOptions.length > 0"
      v-model="selectedListId"
      :items="listOptions"
      value-key="id"
      label-key="label"
      placeholder="Select list..."
      size="sm"
      aria-label="Seniority List"
      class="w-full sm:w-72"
    />
    <UBadge v-if="isDemo" color="neutral" variant="outline" size="sm">Demo</UBadge>
    <UBadge v-if="isHistorical" color="neutral" variant="outline" size="sm">Historical</UBadge>
  </div>
</template>
