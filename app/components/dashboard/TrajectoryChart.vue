<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-highlighted">Seniority Trajectory</h3>
        <UBadge color="primary" variant="subtle" size="sm">Projected</UBadge>
      </div>
    </template>

    <ClientOnly>
      <DashboardChart type="line" :data="chartData" :height="280" :options="chartOptions" />
      <template #fallback>
        <USkeleton class="h-[280px] w-full" />
      </template>
    </ClientOnly>
  </UCard>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  data: { labels: string[]; data: number[] }
}>()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.data.labels,
  datasets: [{
    label: 'Seniority Number',
    data: props.data.data,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    fill: true,
    tension: 0.3,
    pointRadius: 0,
    pointHitRadius: 10,
  }],
}))

const chartOptions: ChartOptions<'line'> = {
  scales: {
    y: { reverse: true, title: { display: true, text: 'Seniority #' } },
  },
}
</script>
