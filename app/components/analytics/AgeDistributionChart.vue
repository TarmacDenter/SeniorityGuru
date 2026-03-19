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
  buckets: { label: string; count: number }[]
  nullCount: number
}>()

const { defaults, colors } = useChartTheme()

const chartData = computed(() => ({
  labels: props.buckets.map((b) => b.label),
  datasets: [
    {
      label: 'Pilots',
      data: props.buckets.map((b) => b.count),
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
      borderWidth: 1,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  ...defaults,
  plugins: {
    ...defaults.plugins,
    legend: { display: false },
  },
  scales: {
    ...defaults.scales,
    y: {
      ...defaults.scales?.y,
      beginAtZero: true,
      ticks: {
        ...defaults.scales?.y?.ticks,
        stepSize: 1,
      },
    },
  },
} as ChartOptions<'bar'>))
</script>

<template>
  <div>
    <ClientOnly>
      <div class="h-64 relative">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <template #fallback>
        <USkeleton class="h-64 w-full" />
      </template>
    </ClientOnly>
    <p v-if="nullCount > 0" class="mt-2 text-xs text-[var(--ui-text-muted)]">
      * {{ nullCount }} pilot{{ nullCount === 1 ? '' : 's' }} excluded (no retirement date on file).
      Age derived using mandatory retirement age of 65.
    </p>
  </div>
</template>
