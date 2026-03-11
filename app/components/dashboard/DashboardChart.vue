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

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key in source) {
    const sv = source[key]
    const tv = result[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv, sv)
    } else if (sv !== undefined) {
      result[key] = sv
    }
  }
  return result
}

const mergedOptions = computed(() =>
  deepMerge(defaults as Record<string, any>, (props.options ?? {}) as Record<string, any>)
)
</script>
