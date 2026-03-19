<script setup lang="ts">
defineProps<{
  row: {
    qualKey: string
    fleet: string
    seat: string
    total: number
    caCount: number
    foCount: number
    caFoRatio: number
    byBase: { base: string; count: number; pct: number }[]
  }
}>()
</script>

<template>
  <div class="flex items-center justify-between rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-2.5">
    <span class="font-medium text-sm">{{ row.qualKey }}</span>
    <span class="text-sm text-[var(--ui-text-muted)] font-mono">{{ row.total.toLocaleString() }}</span>
  </div>
</template>
