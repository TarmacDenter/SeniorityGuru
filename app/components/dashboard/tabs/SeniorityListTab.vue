<script setup lang="ts">
defineProps<{
  loading: boolean
}>()
</script>

<template>
  <SeniorityListViewer :loading="loading" class="h-full" />
</template>
