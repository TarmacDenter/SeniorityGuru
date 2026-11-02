<script setup lang="ts">
import type { ChartData, TooltipItem } from 'chart.js'
import { formatMonthYear, formatYear } from '~/utils/date'

const props = defineProps<{
  /** The trajectory, named by its scope, with an optional second trajectory on the same axes. */
  data: {
    label?: string
    labels: string[]
    data: number[]
    overlay?: { label: string; data: number[] } | null
  }
  /** Why the samples stop early, e.g. "Anchor Pilot retired". */
  endedByLabel?: string | null
}>()

const { colors } = useChartTheme()

const chartData = computed<ChartData<'line'>>(() => {
  const overlay = props.data.overlay
  const datasets: ChartData<'line'>['datasets'] = [{
    label: props.data.label ?? 'Seniority %',
    data: props.data.data,
    borderColor: colors.ink,
    backgroundColor: colors.inkFill,
    fill: !overlay,
    tension: 0.3,
    pointRadius: 0,
    pointHitRadius: 10,
  }]
  if (overlay) {
    datasets.push({
      label: overlay.label,
      data: overlay.data,
      borderColor: colors.soft,
      backgroundColor: colors.softFill,
      borderDash: [6, 4],
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      pointHitRadius: 10,
    })
  }
  return { labels: props.data.labels, datasets }
})

const chartOptions = computed(() => ({
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: !!props.data.overlay },
    tooltip: {
      callbacks: {
        title(items: TooltipItem<'line'>[]) {
          const label = items[0]?.label
          if (!label) return ''
          return formatMonthYear(label)
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
          return formatYear(label);
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
}))
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center">
          <h2 class="font-semibold text-highlighted">Your Seniority Percentile over time</h2>
          <InfoIcon text="Shows how your seniority percentile changes as pilots senior to you retire. Percentile: 100% = most senior, 0% = most junior." size="sm" class="ml-1.5" />
          <slot name="badge" />
        </div>
        <slot name="controls">
          <UBadge color="primary" variant="subtle" size="sm">Projected</UBadge>
        </slot>
      </div>
    </template>

    <ClientOnly>
      <DashboardChart type="line" :data="chartData" :height="280" :options="chartOptions" />
      <template #fallback>
        <USkeleton class="h-[280px] w-full" />
      </template>
    </ClientOnly>

    <p v-if="endedByLabel" data-testid="trajectory-ended-by" class="mt-2 text-xs text-muted">{{ endedByLabel }}</p>
    <slot name="footer" />
  </UCard>
</template>
