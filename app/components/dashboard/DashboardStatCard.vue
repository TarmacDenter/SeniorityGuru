<template>
  <UCard>
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-muted">{{ label }}</p>
        <p class="text-2xl font-bold font-mono text-highlighted mt-1">{{ value }}</p>
        <p v-if="trend" class="text-xs mt-1" :class="trendUp ? 'text-green-400' : 'text-red-400'">
          {{ trend }}
        </p>
      </div>
      <UIcon v-if="icon" :name="icon" class="size-8 text-primary/60" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon?: string
}>()
</script>
