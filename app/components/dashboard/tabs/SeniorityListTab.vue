<script setup lang="ts">
defineProps<{
  loading: boolean
  compactControlsOpen?: boolean
}>()
</script>

<template>
  <SeniorityListViewer :loading="loading" :compact-controls-open="compactControlsOpen" class="h-full" />
</template>
