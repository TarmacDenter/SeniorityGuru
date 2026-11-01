<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  BarController,
  LineController,
  type TooltipItem,
} from 'chart.js'

ChartJS.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps<{
  waveBuckets: readonly { year: number; retirementCount: number; isRetirementWave: boolean }[]
  trajectoryPoints: readonly { date: import('~/utils/temporal').PlainDate; rank: number; percentile: number }[]
  qualificationScope: string
}>()

const { defaults, colors } = useChartTheme()

/** The Anchor Pilot's Seniority Percentile at the start of each year the wave covers. */
const percentileByYear = computed(() => {
  const byYear = new Map<number, number>()
  for (const point of props.trajectoryPoints) {
    const year = Number(point.date.toString().slice(0, 4))
    if (!byYear.has(year)) byYear.set(year, point.percentile)
  }
  return byYear
})

const chartData = computed(() => ({
  labels: props.waveBuckets.map((b) => String(b.year)),
  datasets: [
    {
      type: 'bar' as const,
      label: 'Retirements',
      data: props.waveBuckets.map((b) => b.retirementCount),
      backgroundColor: props.waveBuckets.map(b => b.isRetirementWave ? colors.ink : colors.inkFill),
      borderColor: colors.ink,
      borderWidth: 1,
      yAxisID: 'y',
      order: 2,
    },
    ...(props.trajectoryPoints.length > 0
      ? [{
          type: 'line' as const,
          label: 'Your Seniority Percentile',
          data: props.waveBuckets.map((b) => percentileByYear.value.get(b.year) ?? null),
          borderColor: colors.mark,
          backgroundColor: colors.mark,
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 2,
          pointHitRadius: 10,
          spanGaps: true,
          yAxisID: 'y1',
          order: 1,
        }]
      : []),
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
        label: (item: TooltipItem<'bar'>) => item.dataset.yAxisID === 'y1'
          ? `${(item.parsed.y ?? 0).toFixed(1)}% seniority`
          : `${item.parsed.y} retiree${item.parsed.y === 1 ? '' : 's'}${
            props.waveBuckets[item.dataIndex]?.isRetirementWave ? ' ⚠ Wave year' : ''
          }`,
      },
    },
  },
  scales: {
    ...defaults.scales,
    y: {
      ...defaults.scales?.y,
      beginAtZero: true,
      ticks: { ...defaults.scales?.y?.ticks, stepSize: 1 },
    },
    y1: {
      display: props.trajectoryPoints.length > 0,
      position: 'right',
      min: 0,
      max: 100,
      grid: { drawOnChartArea: false },
      ticks: { ...defaults.scales?.y?.ticks, callback: (v: string | number) => `${v}%` },
    },
  },
} as ChartOptions<'bar'>))
</script>

<template>
  <div>
    <p class="mb-1 text-xs font-medium text-muted">
      Retirements per year<template v-if="trajectoryPoints.length > 0"> and your Seniority Percentile</template>{{ qualificationScope ? ` — ${qualificationScope}` : '' }}
    </p>
    <ClientOnly>
      <div class="relative h-56 sm:h-64">
        <Bar :data="chartData as any" :options="chartOptions" />
      </div>
      <template #fallback>
        <USkeleton class="h-56 w-full sm:h-64" />
      </template>
    </ClientOnly>
  </div>
</template>
