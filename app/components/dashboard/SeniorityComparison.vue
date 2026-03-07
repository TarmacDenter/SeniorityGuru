<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-highlighted">Seniority Projection</h3>
        <div class="flex items-center gap-2">
          <USelect v-model="currentScope" :items="scopeOptions" size="xs" class="min-w-40" placeholder="Current" />
          <span class="text-xs text-muted">vs</span>
          <USelect v-model="compareScope" :items="scopeOptions" size="xs" class="min-w-40" placeholder="What if..." />
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
import type { ChartData } from 'chart.js'
import type { Tables } from '#shared/types/database'

type SeniorityEntry = Tables<'seniority_entries'>
type FilterFn = (entry: SeniorityEntry) => boolean

type Qual = { seat: string; fleet: string; base: string; label: string }

const props = defineProps<{
  quals: Qual[]
  computeComparative: (
    currentFilter: FilterFn,
    compareFilter: FilterFn
  ) => { labels: string[]; currentData: number[]; compareData: number[] }
  userBase?: string
  userSeat?: string
  userFleet?: string
}>()

// Default to user's combo if available
const defaultScope = computed(() => {
  if (props.userSeat && props.userFleet && props.userBase) {
    return `${props.userSeat}/${props.userFleet}/${props.userBase}`
  }
  if (props.userBase) return `Base: ${props.userBase}`
  return 'Company-wide'
})

const currentScope = ref(defaultScope.value)
const compareScope = ref('')

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
    pointHitRadius: 10,
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
      pointHitRadius: 10,
    })
  }

  return { labels: result.labels, datasets }
})

const chartOptions = {
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    tooltip: {
      callbacks: {
        title(items: any[]) {
          const label = items[0]?.label
          if (!label) return ''
          const d = new Date(label)
          return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        },
        label(item: any) {
          return `${item.dataset.label}: ${item.parsed.y}%`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        callback(this: any, _value: any, index: number) {
          // Show year labels only
          const labels = chartData.value.labels as string[]
          const label = labels?.[index]
          if (!label) return ''
          return new Date(label).getFullYear().toString()
        },
      },
    },
    y: {
      min: 0,
      max: 100,
      title: { display: true, text: 'Seniority %' },
      ticks: { callback: (v: any) => `${v}%` },
    },
  },
}
</script>
