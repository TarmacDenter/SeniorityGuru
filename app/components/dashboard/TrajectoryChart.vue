<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-highlighted">Company Seniority Trajectory</h3>
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
import type { ChartData } from 'chart.js'

const props = defineProps<{
  data: { labels: string[]; data: number[] }
}>()

const { colors } = useChartTheme()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.data.labels,
  datasets: [{
    label: 'Seniority %',
    data: props.data.data,
    borderColor: colors.amber,
    backgroundColor: colors.amberLight,
    fill: true,
    tension: 0.3,
    pointRadius: 0,
    pointHitRadius: 10,
  }],
}))

const chartOptions = {
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    tooltip: {
      callbacks: {
        title(items: any[]) {
          const label = items[0]?.label
          if (!label) return ''
          const d = new Date(label)
          return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        },
        label(item: any) {
          return `${item.dataset.label}: ${item.parsed.y}%`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        callback(this: any, _value: any, index: number) {
          const label = props.data.labels[index];
          if (!label) return '';
          return new Date(label).getFullYear().toString();
        },
      },
    },
    y: {
      min: 0,
      max: 100,
      title: { display: true, text: 'Seniority %' },
      ticks: { callback: (v: any) => `${v}%` },
    },
  },
};
</script>
