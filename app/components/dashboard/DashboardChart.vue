<template>
  <component
    :is="chartComponent"
    :data="(data as any)"
    :options="(mergedOptions as any)"
    class="w-full"
    :style="{ height: height + 'px' }"
  />
</template>

<script setup lang="ts">
import { Bar, Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = withDefaults(defineProps<{
  type: 'bar' | 'line' | 'doughnut'
  data: ChartData
  options?: ChartOptions
  height?: number
}>(), {
  height: 300
})

const { defaults } = useChartTheme()

const chartComponents = { bar: Bar, line: Line, doughnut: Doughnut } as const
const chartComponent = computed(() => chartComponents[props.type])

const mergedOptions = computed(() => ({
  ...defaults,
  ...props.options
}))
</script>
