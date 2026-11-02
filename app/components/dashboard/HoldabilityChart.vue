<script setup lang="ts">
import type { ChartData, TooltipItem } from 'chart.js'
import type { HoldabilityDetailView } from '~/composables/seniority'
import { formatYear } from '~/utils/date'

// The Anchor Pilot's projected Seniority Percentile against one Qualification Threshold, with today's
// most junior pilot in the Qualification projected alongside as a dashed reference.
const props = defineProps<{
  detail: HoldabilityDetailView
}>()

const { colors } = useChartTheme()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: [...props.detail.labels],
  datasets: [
    {
      label: 'Your Seniority Percentile',
      data: [...props.detail.anchorSeries],
      borderColor: colors.ink,
      backgroundColor: colors.ink,
      borderWidth: 3,
      pointRadius: 0,
      pointHitRadius: 10,
      tension: 0.2,
    },
    {
      label: 'Qualification Threshold today',
      data: props.detail.labels.map(() => props.detail.thresholdPercentile),
      borderColor: colors.soft,
      borderWidth: 1.5,
      pointRadius: 0,
      pointHitRadius: 0,
    },
    {
      label: 'Today\'s most junior pilot',
      data: [...props.detail.thresholdPilotSeries],
      borderColor: colors.soft,
      borderDash: [6, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      pointHitRadius: 10,
      tension: 0.2,
      spanGaps: false,
    },
  ],
}))

const chartOptions = {
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items: TooltipItem<'line'>[]) => (items[0]?.label ? formatYear(items[0].label) : ''),
        label: (item: TooltipItem<'line'>) => `${item.dataset.label}: ${item.parsed.y?.toFixed(1)}%`,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 8,
        callback(_value: string | number, index: number) {
          const label = props.detail.labels[index]
          return label ? formatYear(label) : ''
        },
      },
    },
    y: { min: 0, max: 100, ticks: { callback: (value: string | number) => `${value}%` } },
  },
}
</script>

<template>
  <div class="space-y-2">
    <ClientOnly>
      <DashboardChart type="line" :data="chartData" :options="chartOptions" :height="180" />
      <template #fallback>
        <USkeleton class="h-[180px] w-full" />
      </template>
    </ClientOnly>
    <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Chart legend">
      <li class="flex items-center gap-1.5"><span class="inline-block w-5 border-t-[3px] border-current text-toned" aria-hidden="true" />Your Seniority Percentile</li>
      <li class="flex items-center gap-1.5"><span class="inline-block w-5 border-t-2 border-current" aria-hidden="true" />Qualification Threshold today</li>
      <li class="flex items-center gap-1.5"><span class="inline-block w-5 border-t-2 border-dashed border-current" aria-hidden="true" />Today's most junior pilot</li>
    </ul>
  </div>
</template>
