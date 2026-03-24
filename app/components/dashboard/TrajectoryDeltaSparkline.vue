<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import type { TrajectoryDelta } from '~/utils/seniority-math'

const props = defineProps<{
  deltas: TrajectoryDelta[]
}>()

const { colors } = useChartTheme()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.deltas.map((d) => {
    const date = new Date(d.date)
    return date.getFullYear().toString()
  }),
  datasets: [
    {
      label: 'pp/yr',
      data: props.deltas.map((d) => d.delta),
      backgroundColor: props.deltas.map((d) =>
        d.isPeak ? colors.peakHighlight : colors.primaryLight,
      ),
      borderColor: props.deltas.map((d) =>
        d.isPeak ? colors.peakBorder : colors.primary,
      ),
      borderWidth: 1,
    },
  ],
}))

const chartOptions: ChartOptions = {
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 6,
        font: { size: 9 },
        color: '#64748b',
      },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        maxTicksLimit: 3,
        font: { size: 9 },
        color: '#64748b',
      },
      grid: { color: 'rgba(51, 65, 85, 0.2)' },
    },
  },
}

const bestYear = computed(() => {
  if (props.deltas.length === 0) return null
  let best = props.deltas[0]!
  for (const d of props.deltas) {
    if (d.delta > best.delta) best = d
  }
  if (best.delta <= 0) return null
  return {
    year: new Date(best.date).getFullYear(),
    delta: best.delta,
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
      Best year: {{ bestYear.year }} (+{{ bestYear.delta }}pp)
    </p>
  </UCard>
</template>
