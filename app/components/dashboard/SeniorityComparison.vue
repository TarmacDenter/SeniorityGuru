<script setup lang="ts">
import type { ChartData, TooltipItem } from 'chart.js'
import type { QualSpec } from '#shared/utils/seniority-engine'
import type { SeniorityEntry } from '#shared/schemas/seniority-list'

const props = defineProps<{
  entries: readonly SeniorityEntry[]
  computeComparative: (
    specA: QualSpec,
    specB: QualSpec
  ) => { labels: string[]; currentData: number[]; compareData: number[] }
  userBase?: string
  userSeat?: string
  userFleet?: string
}>()

const { colors } = useChartTheme()
const entriesRef = computed(() => props.entries)
const { scopeOptions, specForLabel } = useScopeFilter(entriesRef)

const defaultScope = computed(() => {
  if (props.userBase && props.userSeat && props.userFleet) {
    // Find the matching label from scope options
    return scopeOptions.value.find(label =>
      label !== 'Company-wide' && label.includes(props.userBase!) && label.includes(props.userSeat!) && label.includes(props.userFleet!),
    ) ?? 'Company-wide'
  }
  if (props.userBase) {
    return scopeOptions.value.find(label => label === props.userBase) ?? 'Company-wide'
  }
  return 'Company-wide'
})

const currentScope = ref(defaultScope.value)
const compareScope = ref('')

const chartData = computed<ChartData<'line'>>(() => {
  const result = props.computeComparative(
    specForLabel(currentScope.value),
    specForLabel(compareScope.value || currentScope.value),
  )

  const datasets: ChartData<'line'>['datasets'] = [{
    label: currentScope.value || 'Company-wide',
    data: result.currentData,
    borderColor: colors.amber,
    backgroundColor: colors.amberLight,
    fill: false,
    tension: 0.3,
    pointRadius: 0,
    pointHitRadius: 10,
  }]

  if (compareScope.value && compareScope.value !== currentScope.value) {
    datasets.push({
      label: compareScope.value,
      data: result.compareData,
      borderColor: colors.cyan,
      backgroundColor: colors.cyanLight,
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
        title(items: TooltipItem<'line'>[]) {
          const label = items[0]?.label
          if (!label) return ''
          const d = new Date(label)
          return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        },
        label(item: TooltipItem<'line'>) {
          return `${item.dataset.label}: ${item.parsed.y}%`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        callback(_value: string | number, index: number) {
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
      ticks: { callback: (v: string | number) => `${v}%` },
    },
  },
}
</script>

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
