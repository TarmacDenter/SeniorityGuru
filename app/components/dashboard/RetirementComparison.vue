<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <h3 class="font-semibold text-highlighted">Retirement Projections</h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted">% of remaining</span>
            <USwitch v-model="showPercentage" size="xs" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <USelect v-model="currentScope" :items="scopeOptions" size="xs" class="min-w-40" placeholder="Current" />
          <span class="text-xs text-muted">vs</span>
          <USelect v-model="compareScope" :items="scopeOptions" size="xs" class="min-w-40" placeholder="Compare" />
        </div>
      </div>
    </template>

    <ClientOnly>
      <DashboardChart type="bar" :data="chartData" :height="280" :options="chartOptions" />
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

type Qual = { seat: string; fleet: string; base: string; label: string }

const props = defineProps<{
  quals: Qual[]
  computeProjection: (filterFn: FilterFn) => { labels: string[]; data: number[]; filteredTotal: number }
}>()

const currentScope = ref('Company-wide')
const compareScope = ref('')
const showPercentage = ref(false)

const scopeOptions = computed(() => {
  const opts = ['Company-wide']

  // Individual bases, seats, fleets (deduplicated from quals)
  const bases = new Set<string>()
  const seats = new Set<string>()
  const fleets = new Set<string>()
  for (const q of props.quals) {
    bases.add(q.base)
    seats.add(q.seat)
    fleets.add(q.fleet)
  }
  for (const base of Array.from(bases).sort()) opts.push(`Base: ${base}`)
  for (const seat of Array.from(seats).sort()) opts.push(`Seat: ${seat}`)
  for (const fleet of Array.from(fleets).sort()) opts.push(`Fleet: ${fleet}`)

  // Actual qual combos only
  for (const q of props.quals) opts.push(q.label)

  return opts
})

function makeFilter(scope: string): FilterFn {
  if (!scope || scope === 'Company-wide') return () => true

  if (scope.startsWith('Base: ')) {
    const base = scope.replace('Base: ', '')
    return (e) => e.base === base
  }
  if (scope.startsWith('Seat: ')) {
    const seat = scope.replace('Seat: ', '')
    return (e) => e.seat === seat
  }
  if (scope.startsWith('Fleet: ')) {
    const fleet = scope.replace('Fleet: ', '')
    return (e) => e.fleet === fleet
  }

  // seat/fleet/base combo
  const parts = scope.split('/')
  if (parts.length === 3) {
    const [seat, fleet, base] = parts
    return (e) => e.seat === seat && e.fleet === fleet && e.base === base
  }

  return () => true
}

function toPercentages(data: number[], filteredTotal: number): number[] {
  let remaining = filteredTotal
  return data.map((count) => {
    const pct = remaining > 0 ? Math.round((count / remaining) * 1000) / 10 : 0
    remaining -= count
    return pct
  })
}

const chartData = computed<ChartData<'bar'>>(() => {
  const current = props.computeProjection(makeFilter(currentScope.value))
  const currentData = showPercentage.value
    ? toPercentages(current.data, current.filteredTotal)
    : current.data

  const datasets: ChartData<'bar'>['datasets'] = [{
    label: currentScope.value || 'Company-wide',
    data: currentData,
    backgroundColor: 'rgba(245, 158, 11, 0.6)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 4,
  }]

  if (compareScope.value && compareScope.value !== currentScope.value) {
    const compare = props.computeProjection(makeFilter(compareScope.value))
    const compareData = showPercentage.value
      ? toPercentages(compare.data, compare.filteredTotal)
      : compare.data

    datasets.push({
      label: compareScope.value,
      data: compareData,
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4,
    })
  }

  return { labels: current.labels, datasets }
})

const chartOptions = computed(() => ({
  scales: {
    y: showPercentage.value
      ? { title: { display: true, text: '% of remaining pilots' }, ticks: { callback: (v: any) => `${v}%` } }
      : {},
  },
}))
</script>
