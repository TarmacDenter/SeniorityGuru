<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="max-w-2xl space-y-2">
    <h2 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">{{ title }}</h2>
    <p class="text-muted">{{ description }}</p>
  </div>
</template>
