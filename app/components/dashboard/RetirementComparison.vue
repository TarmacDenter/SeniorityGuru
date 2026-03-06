<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-highlighted">Retirement Projections</h3>
        <div class="flex items-center gap-2">
          <USelect v-model="currentScope" :items="scopeOptions" size="xs" placeholder="Current" />
          <span class="text-xs text-muted">vs</span>
          <USelect v-model="compareScope" :items="scopeOptions" size="xs" placeholder="Compare" />
        </div>
      </div>
    </template>

    <ClientOnly>
      <DashboardChart type="bar" :data="chartData" :height="280" />
      <template #fallback>
        <USkeleton class="h-[280px] w-full" />
      </template>
    </ClientOnly>
  </UCard>
</template>

<script setup lang="ts">
import type { ChartData } from 'chart.js'
import type { Tables } from '#shared/types/database'

type SeniorityEntry = Tables<'seniority_entries'>
type FilterFn = (entry: SeniorityEntry) => boolean

const props = defineProps<{
  filterOptions: { bases: string[]; seats: string[]; fleets: string[] }
  computeProjection: (filterFn: FilterFn) => { labels: string[]; data: number[] }
}>()

const currentScope = ref('Company-wide')
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

const chartData = computed<ChartData<'bar'>>(() => {
  const current = props.computeProjection(makeFilter(currentScope.value))
  const datasets: ChartData<'bar'>['datasets'] = [{
    label: currentScope.value || 'Company-wide',
    data: current.data,
    backgroundColor: 'rgba(245, 158, 11, 0.6)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 4,
  }]

  if (compareScope.value && compareScope.value !== currentScope.value) {
    const compare = props.computeProjection(makeFilter(compareScope.value))
    datasets.push({
      label: compareScope.value,
      data: compare.data,
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4,
    })
  }

  return { labels: current.labels, datasets }
})
</script>
