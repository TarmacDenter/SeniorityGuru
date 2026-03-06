<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-highlighted">Seniority Projection</h3>
        <div class="flex items-center gap-2">
          <USelect v-model="currentScope" :items="scopeOptions" size="xs" placeholder="Current" />
          <span class="text-xs text-muted">vs</span>
          <USelect v-model="compareScope" :items="scopeOptions" size="xs" placeholder="What if..." />
        </div>
      </div>
    </template>

    <ClientOnly>
      <DashboardChart type="line" :data="chartData" :height="280" :options="chartOptions" />
      <template #fallback>
        <USkeleton class="h-[280px] w-full" />
      </template>
    </ClientOnly>
  </UCard>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import type { Tables } from '#shared/types/database'

type SeniorityEntry = Tables<'seniority_entries'>
type FilterFn = (entry: SeniorityEntry) => boolean

const props = defineProps<{
  filterOptions: { bases: string[]; seats: string[]; fleets: string[] }
  computeComparative: (
    currentFilter: FilterFn,
    compareFilter: FilterFn
  ) => { labels: string[]; currentData: number[]; compareData: number[] }
  userBase?: string
}>()

const currentScope = ref(props.userBase || 'Company-wide')
const compareScope = ref('')

const scopeOptions = computed(() => {
  const opts = ['Company-wide']
  for (const base of props.filterOptions.bases) {
    opts.push(base)
  }
  return opts
})

function makeFilter(scope: string): FilterFn {
  if (!scope || scope === 'Company-wide') return () => true
  return (e) => e.base === scope
}

const chartData = computed<ChartData<'line'>>(() => {
  const result = props.computeComparative(
    makeFilter(currentScope.value),
    makeFilter(compareScope.value || currentScope.value),
  )

  const datasets: ChartData<'line'>['datasets'] = [{
    label: currentScope.value || 'Company-wide',
    data: result.currentData,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    fill: false,
    tension: 0.3,
    pointRadius: 0,
  }]

  if (compareScope.value && compareScope.value !== currentScope.value) {
    datasets.push({
      label: compareScope.value,
      data: result.compareData,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      fill: false,
      tension: 0.3,
      pointRadius: 0,
    })
  }

  return { labels: result.labels, datasets }
})

const chartOptions: ChartOptions<'line'> = {
  scales: {
    y: { reverse: true, title: { display: true, text: 'Seniority #' } },
  },
}
</script>
