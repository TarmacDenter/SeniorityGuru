<template>
  <div>
    <p class="mb-1 text-xs font-medium text-[var(--ui-text-muted)]">
      YoY Percentile Point Change{{ selectedQual ? ` — ${selectedQual}` : '' }}
    </p>
    <ClientOnly>
      <div class="h-56 relative">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <template #fallback>
        <USkeleton class="h-56 w-full" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartOptions, TooltipItem } from 'chart.js'
import type { TrajectoryDelta } from '#shared/utils/seniority-math'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
)

const props = defineProps<{
  deltas: TrajectoryDelta[]
  selectedQual: string
}>()

const { defaults, colors } = useChartTheme()

const chartData = computed(() => ({
  labels: props.deltas.map((d) => {
    const date = new Date(d.date)
    return date.getFullYear().toString()
  }),
  datasets: [
    {
      label: 'Percentile Change (pp/yr)',
      data: props.deltas.map((d) => d.delta),
      backgroundColor: props.deltas.map((d) =>
        d.isPeak ? 'rgba(251, 191, 36, 0.7)' : colors.primaryLight,
      ),
      borderColor: props.deltas.map((d) =>
        d.isPeak ? '#f59e0b' : colors.primary,
      ),
      borderWidth: 1,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  ...defaults,
  plugins: {
    ...defaults.plugins,
    legend: { display: false },
    tooltip: {
      ...defaults.plugins?.tooltip,
      callbacks: {
        label: (item: TooltipItem<'bar'>) => {
          const delta = props.deltas[item.dataIndex]
          const y = item.parsed.y ?? 0
          const sign = y >= 0 ? '+' : ''
          const peak = delta?.isPeak ? ' (Peak year)' : ''
          return `${sign}${y}pp${peak}`
        },
      },
    },
  },
  scales: {
    ...defaults.scales,
    y: {
      ...defaults.scales?.y,
      beginAtZero: true,
      ticks: {
        ...defaults.scales?.y?.ticks,
        callback: (v: string | number) => `${Number(v) >= 0 ? '+' : ''}${v}pp`,
      },
    },
  },
} as ChartOptions<'bar'>))
</script>
