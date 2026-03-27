<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <ULink to="/dashboard" class="font-bold text-lg inline-flex items-center gap-2">
    <UIcon name="i-lucide-plane" class="size-5 text-primary" />
    <span v-if="!collapsed" class="text-highlighted">SeniorityGuru</span>
  </ULink>
</template>
