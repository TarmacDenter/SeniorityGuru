<script setup lang="ts">
// The Lists panel: choose a Seniority List, reach Compare and Upload, and read the full list.
const selectedListId = defineModel<number | undefined>('selectedListId')

defineProps<{
  loading: boolean
  listOptions: { id: number | undefined; label: string; isLatest: boolean }[]
  isDemo: boolean
  isHistorical: boolean
}>()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
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
      <span class="flex-1" />
      <UButton to="/seniority/compare" icon="i-lucide-git-compare-arrows" color="neutral" variant="outline" size="sm">Compare</UButton>
      <UButton to="/seniority/upload" icon="i-lucide-upload" color="neutral" variant="outline" size="sm">Upload</UButton>
    </div>
    <SeniorityListViewer :loading="loading" class="min-h-0 flex-1" />
  </div>
</template>
