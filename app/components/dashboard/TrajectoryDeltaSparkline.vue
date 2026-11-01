<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import type { PresentedTrajectoryChange } from '~/utils/seniority'
import { formatYear, extractYear } from '~/utils/date'

const props = defineProps<{
  changes: PresentedTrajectoryChange[]
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

const bestYear = computed(() => {
  if (props.changes.length === 0) return null
  let best = props.changes[0]!
  for (const change of props.changes) {
    if (change.percentilePointChange > best.percentilePointChange) best = change
  }
  if (best.percentilePointChange <= 0) return null
  return {
    year: extractYear(best.date),
    percentilePointChange: best.percentilePointChange,
  }
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-highlighted">Improvement Rate</h3>
        <UBadge color="primary" variant="subtle" size="sm">YoY</UBadge>
      </div>
    </template>

    <ClientOnly>
      <DashboardChart type="bar" :data="chartData" :height="120" :options="chartOptions" />
      <template #fallback>
        <USkeleton class="h-[120px] w-full" />
      </template>
    </ClientOnly>

    <p v-if="bestYear" class="mt-2 text-xs text-[var(--ui-text-muted)]">
      Best year: {{ bestYear.year }} (+{{ bestYear.percentilePointChange }}pp)
    </p>
  </UCard>
</template>
