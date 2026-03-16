<template>
  <SeniorityListViewer :loading="loading" class="h-full" />
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
}>()
</script>
