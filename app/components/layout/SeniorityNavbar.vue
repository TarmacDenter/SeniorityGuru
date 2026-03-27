<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <UDashboardNavbar :title="description ? undefined : title">
    <template v-if="description" #title>
      <div class="flex flex-col leading-none gap-0.5">
        <span class="font-semibold text-sm">{{ title }}</span>
        <span class="text-xs text-muted font-normal">{{ description }}</span>
      </div>
    </template>

    <template #left>
      <slot name="left" />
    </template>

    <template #right>
      <slot name="right" />
    </template>
  </UDashboardNavbar>
</template>
