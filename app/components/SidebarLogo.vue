<template>
  <ULink to="/" class="font-bold text-lg inline-flex items-center gap-2">
    <UIcon name="i-lucide-plane" class="size-5 text-primary" />
    <span v-if="!collapsed" class="text-highlighted">SeniorityGuru</span>
  </ULink>
</template>

<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>
