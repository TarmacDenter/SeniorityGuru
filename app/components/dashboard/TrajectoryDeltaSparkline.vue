<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import type { PresentedTrajectoryChange } from '~/utils/seniority'
import { formatYear } from '~/utils/date'

const props = defineProps<{
  changes: PresentedTrajectoryChange[]
  /** e.g. "Best year: 2031 (+3.2pp)"; null when no year improves. */
  bestYearLabel: string | null
}>()

const { colors } = useChartTheme()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.changes.map((change) => {
    return formatYear(change.date)
  }),
  datasets: [
    {
      label: 'pp/yr',
      data: props.changes.map(change => change.percentilePointChange),
      backgroundColor: props.changes.map(change => change.isPeak ? colors.ink : colors.inkFill),
      borderColor: colors.ink,
      borderWidth: 1,
    },
  ],
}))

const chartOptions = computed<ChartOptions>(() => ({
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 6,
        font: { size: 9 },
        color: colors.soft,
      },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        maxTicksLimit: 3,
        font: { size: 9 },
        color: colors.soft,
      },
      grid: { color: colors.rule },
    },
  },
}))
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-serif text-lg font-semibold text-highlighted">Improvement Rate</h3>
        <UBadge color="neutral" variant="outline" size="sm">YoY</UBadge>
      </div>
    </template>

    <ClientOnly>
      <DashboardChart type="bar" :data="chartData" :height="120" :options="chartOptions" />
      <template #fallback>
        <USkeleton class="h-[120px] w-full" />
      </template>
    </ClientOnly>

    <p v-if="bestYearLabel" data-testid="best-year" class="mt-2 font-mono text-xs text-muted">
      {{ bestYearLabel }}
    </p>
  </UCard>
</template>
