<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <DashboardStatCard
      v-for="stat in stats"
      :key="stat.label"
      :label="stat.label"
      :value="stat.value"
      :trend="stat.trend"
      :trend-up="stat.trendUp"
      :icon="stat.icon"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: Array<{
    label: string
    value: string
    trend?: string
    trendUp?: boolean
    icon?: string
  }>
}>()
</script>
