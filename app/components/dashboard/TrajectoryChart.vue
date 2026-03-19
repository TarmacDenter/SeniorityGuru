<script setup lang="ts">
import type { ChartData, TooltipItem } from 'chart.js'

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
        title(items: TooltipItem<'line'>[]) {
          const label = items[0]?.label
          if (!label) return ''
          const d = new Date(label)
          return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        },
        label(item: TooltipItem<'line'>) {
          return `${item.dataset.label}: ${item.parsed.y}%`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        callback(_value: string | number, index: number) {
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
      ticks: { callback: (v: string | number) => `${v}%` },
    },
  },
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <h3 class="font-semibold text-highlighted">Company Seniority Trajectory</h3>
          <InfoIcon text="Shows how your seniority percentile changes as pilots senior to you retire. Percentile: 100% = most senior, 0% = most junior." size="sm" class="ml-1.5" />
          <slot name="badge" />
        </div>
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
