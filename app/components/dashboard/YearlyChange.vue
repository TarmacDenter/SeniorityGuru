<script setup lang="ts">
import { h } from 'vue'
import type { ChartData, ChartOptions } from 'chart.js'
import type { TableColumn } from '@nuxt/ui'
import type { PresentedTrajectoryChange } from '~/utils/seniority'

// One row per projection year in the scenario's Qualification Scope, with the yearly changes charted in the header.
const props = defineProps<{
  changes: PresentedTrajectoryChange[]
  /** e.g. "Best year: 2031 (+3.2pp)"; null when no year improves. */
  bestYearLabel: string | null
  /** " — <scope>" for a scoped scenario; empty company-wide. */
  scopeSuffix: string
}>()

const { colors } = useChartTheme()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.changes.map(change => change.yearLabel),
  datasets: [{
    label: 'pp',
    data: props.changes.map(change => change.percentilePointChange),
    backgroundColor: props.changes.map(change => change.isPeak ? colors.ink : colors.inkFill),
    borderColor: colors.ink,
    borderWidth: 1,
  }],
}))

const chartOptions = computed<ChartOptions>(() => ({
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { maxTicksLimit: 6, font: { size: 9 }, color: colors.soft }, grid: { display: false } },
    y: { beginAtZero: true, ticks: { maxTicksLimit: 3, font: { size: 9 }, color: colors.soft }, grid: { color: colors.rule } },
  },
}))

const columns: TableColumn<PresentedTrajectoryChange>[] = [
  { accessorKey: 'yearLabel', header: 'Year' },
  { accessorKey: 'changeLabel', header: () => h('div', { class: 'text-right' }, 'Change'), meta: { class: { td: 'text-right font-mono' } } },
  { accessorKey: 'percentileLabel', header: () => h('div', { class: 'text-right' }, 'Seniority Percentile'), meta: { class: { td: 'text-right font-mono' } } },
]
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 class="font-semibold text-highlighted">Yearly change{{ scopeSuffix }}</h3>
        <p v-if="bestYearLabel" data-testid="best-year" class="font-mono text-xs text-muted">{{ bestYearLabel }}</p>
      </div>
      <ClientOnly>
        <DashboardChart type="bar" :data="chartData" :height="80" :options="chartOptions" class="mt-2" />
        <template #fallback>
          <USkeleton class="mt-2 h-[80px] w-full" />
        </template>
      </ClientOnly>
    </template>

    <UTable
      data-testid="yearly-change"
      :data="changes"
      :columns="columns"
      sticky
      class="max-h-72"
      :ui="{ thead: 'bg-default', td: 'py-1.5', th: 'py-2' }"
    />
  </UCard>
</template>
