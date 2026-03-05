<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-highlighted">Retirement Projections</h3>
        <UBadge color="primary" variant="subtle" size="sm">Next 10 Years</UBadge>
      </div>
    </template>

    <ClientOnly>
      <DashboardChart type="bar" :data="data" :height="280" />
      <template #fallback>
        <USkeleton class="h-[280px] w-full" />
      </template>
    </ClientOnly>
  </UCard>
</template>

<script setup lang="ts">
import type { ChartData } from 'chart.js'

defineProps<{
  data: ChartData<'bar'>
}>()
</script>
