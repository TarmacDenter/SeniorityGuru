<template>
  <div class="space-y-4">
    <!-- Retirement Wave Bar Chart -->
    <div>
      <p class="mb-1 text-xs font-medium text-[var(--ui-text-muted)]">
        Retirements per Year{{ selectedQual ? ` — ${selectedQual}` : '' }}
      </p>
      <ClientOnly>
        <div class="h-48">
          <Bar :data="waveChartData" :options="waveChartOptions" />
        </div>
        <template #fallback>
          <USkeleton class="h-48 w-full" />
        </template>
      </ClientOnly>
    </div>

    <!-- Trajectory line chart (user percentile over time) -->
    <div v-if="trajectoryPoints.length > 0">
      <p class="mb-1 text-xs font-medium text-[var(--ui-text-muted)]">
        Your Percentile Trajectory{{ selectedQual ? ` — ${selectedQual}` : '' }}
      </p>
      <ClientOnly>
        <div class="h-40">
          <Line :data="trajectoryChartData" :options="trajectoryChartOptions" />
        </div>
        <template #fallback>
          <USkeleton class="h-40 w-full" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bar, Line } from 'vue-chartjs'
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
  type ChartOptions,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

const props = defineProps<{
  waveBuckets: { year: number; count: number; isWave: boolean }[]
  trajectoryPoints: { date: string; rank: number; percentile: number }[]
  selectedQual: string
}>()

const { defaults, colors } = useChartTheme()

// --- Wave chart ---
const waveChartData = computed(() => ({
  labels: props.waveBuckets.map((b) => String(b.year)),
  datasets: [
    {
      label: 'Retirements',
      data: props.waveBuckets.map((b) => b.count),
      backgroundColor: props.waveBuckets.map((b) =>
        b.isWave ? 'rgba(251, 191, 36, 0.7)' : colors.primaryLight,
      ),
      borderColor: props.waveBuckets.map((b) =>
        b.isWave ? '#f59e0b' : colors.primary,
      ),
      borderWidth: 1,
    },
  ],
}))

const waveChartOptions = computed<ChartOptions<'bar'>>(() => ({
  ...defaults,
  plugins: {
    ...defaults.plugins,
    legend: { display: false },
    tooltip: {
      ...defaults.plugins?.tooltip,
      callbacks: {
        label: (item: any) =>
          `${item.parsed.y} retiree${item.parsed.y === 1 ? '' : 's'}${
            props.waveBuckets[item.dataIndex]?.isWave ? ' ⚠ Wave year' : ''
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
  },
} as ChartOptions<'bar'>))

// --- Trajectory chart ---
const trajectoryChartData = computed(() => ({
  labels: props.trajectoryPoints.map((p) => p.date),
  datasets: [
    {
      label: 'Your Percentile',
      data: props.trajectoryPoints.map((p) => p.percentile),
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHitRadius: 10,
    },
  ],
}))

const trajectoryChartOptions = computed<ChartOptions<'line'>>(() => ({
  ...defaults,
  plugins: {
    ...defaults.plugins,
    legend: { display: false },
    tooltip: {
      ...defaults.plugins?.tooltip,
      callbacks: {
        title: (items: any[]) => {
          const label = items[0]?.label
          if (!label) return ''
          return new Date(label).getFullYear().toString()
        },
        label: (item: any) => `${item.parsed.y.toFixed(1)}% seniority`,
      },
    },
  },
  scales: {
    ...defaults.scales,
    x: {
      ...defaults.scales?.x,
      ticks: {
        ...defaults.scales?.x?.ticks,
        callback(_value: any, index: number) {
          const label = props.trajectoryPoints[index]?.date
          if (!label) return ''
          return new Date(label).getFullYear().toString()
        },
      },
    },
    y: {
      ...defaults.scales?.y,
      min: 0,
      max: 100,
      ticks: { ...defaults.scales?.y?.ticks, callback: (v: any) => `${v}%` },
    },
  },
} as ChartOptions<'line'>))
</script>
