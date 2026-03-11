<template>
  <div class="space-y-4">
    <!-- YOS histogram chart -->
    <ClientOnly>
      <div class="h-48">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <template #fallback>
        <USkeleton class="h-48 w-full" />
      </template>
    </ClientOnly>

    <!-- Summary stats row -->
    <div class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--ui-text-muted)]">
      <span>P10 <strong class="text-highlighted font-mono">{{ distribution.p10.toFixed(1) }}y</strong></span>
      <span>P25 <strong class="text-highlighted font-mono">{{ distribution.p25.toFixed(1) }}y</strong></span>
      <span>Median <strong class="text-highlighted font-mono">{{ distribution.median.toFixed(1) }}y</strong></span>
      <span>P75 <strong class="text-highlighted font-mono">{{ distribution.p75.toFixed(1) }}y</strong></span>
      <span>P90 <strong class="text-highlighted font-mono">{{ distribution.p90.toFixed(1) }}y</strong></span>
      <span>Most junior entry <strong class="text-highlighted font-mono">{{ distribution.entryFloor.toFixed(1) }}y</strong></span>
      <span v-if="userYos !== undefined" class="text-primary font-semibold">
        You: {{ userYos.toFixed(1) }}y
      </span>
    </div>
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
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  distribution: {
    entryFloor: number
    p10: number
    p25: number
    median: number
    p75: number
    p90: number
    max: number
  }
  histogram: { label: string; minYos: number; count: number }[]
  userYos: number | undefined
}>()

const { defaults, colors } = useChartTheme()

// Highlight the bucket containing the user's YOS
const chartData = computed(() => ({
  labels: props.histogram.map((b) => b.label),
  datasets: [
    {
      label: 'Pilots',
      data: props.histogram.map((b) => b.count),
      backgroundColor: props.histogram.map((b) =>
        props.userYos !== undefined && props.userYos >= b.minYos && props.userYos < b.minYos + 1
          ? 'rgba(14, 165, 233, 0.8)'   // sky-500 — user's bucket
          : colors.primaryLight,
      ),
      borderColor: props.histogram.map((b) =>
        props.userYos !== undefined && props.userYos >= b.minYos && props.userYos < b.minYos + 1
          ? '#0ea5e9'
          : colors.primary,
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
        label: (item: any) => `${item.parsed.y} pilot${item.parsed.y === 1 ? '' : 's'}`,
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
  },
} as ChartOptions<'bar'>))
</script>
