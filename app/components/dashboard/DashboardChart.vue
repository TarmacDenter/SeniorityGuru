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
  height?: number | 'auto'
}>(), {
  options: undefined,
  height: 300
})

const { defaults } = useChartTheme()

const chartComponents = { bar: Bar, line: Line, doughnut: Doughnut } as const
const chartComponent = computed(() => chartComponents[props.type])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key in source) {
    const sv = source[key]
    const tv = result[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv, sv)
    } else if (sv !== undefined) {
      result[key] = sv as T[Extract<keyof T, string>]
    }
  }
  return result
}

const mergedOptions = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deepMerge(defaults as Record<string, any>, (props.options ?? {}) as Record<string, any>)
)
</script>

<template>
  <div
    class="w-full relative"
    :class="height === 'auto' ? 'h-full' : undefined"
    :style="height !== 'auto' ? { height: height + 'px' } : undefined"
  >
    <component
      :is="chartComponent"
      :data="(data as any)"
      :options="(mergedOptions as any)"
    />
  </div>
</template>
