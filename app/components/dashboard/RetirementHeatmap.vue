<script setup lang="ts">
import { Chart } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, Tooltip, type ChartData, type ChartOptions, type ScriptableContext, type TooltipItem } from 'chart.js'
import { color } from 'chart.js/helpers'
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'
import { useRetirementHeatmap, type RetirementHeatmapPoint } from '~/composables/seniority'

ChartJS.register(MatrixController, MatrixElement, CategoryScale, Tooltip)

// Demographics › Retirement heatmap. Rows, years, values and sentences come from the composable;
// this component only maps them onto the matrix chart.
const {
  hasData, dimensions, toggleDimension, showPercent, scopeLabel, groupedByLabel, isEmpty,
  undatedPilotNote, yearLabels, rowLabels, points, valueLegend, summaryLabel,
  sortBy, sortItems, years, maxYears, yearsLabelFor, yearRangeLabel,
} = useRetirementHeatmap()

// The thumb and its readout move live; the chart follows once it rests.
const sliderYears = useSettledModel(years)
const sliderLabel = computed(() => yearsLabelFor(sliderYears.value))

const { defaults, colors } = useChartTheme()

const ROW_HEIGHT = 22
const COLUMN_WIDTH = 18
const AXIS_ROOM = 64
const chartHeight = computed(() => rowLabels.value.length * ROW_HEIGHT + AXIS_ROOM)
const chartMinWidth = computed(() => yearLabels.value.length * COLUMN_WIDTH + 140)

function cellPoint(context: ScriptableContext<'matrix'>): RetirementHeatmapPoint | undefined {
  return context.raw as RetirementHeatmapPoint | undefined
}

const chartData = computed<ChartData<'matrix', RetirementHeatmapPoint[]>>(() => ({
  datasets: [{
    label: 'Retirements',
    data: points.value,
    backgroundColor: (context) => {
      const intensity = cellPoint(context)?.intensity ?? 0
      return intensity > 0 ? color(colors.heat).alpha(0.12 + intensity * 0.88).rgbString() : 'transparent'
    },
    borderColor: colors.rule,
    borderWidth: 1,
    width: ({ chart }) => Math.max(1, (chart.chartArea?.width ?? 0) / Math.max(1, yearLabels.value.length) - 1),
    height: ({ chart }) => Math.max(1, (chart.chartArea?.height ?? 0) / Math.max(1, rowLabels.value.length) - 1),
  }],
}))

const chartOptions = computed<ChartOptions<'matrix'>>(() => ({
  ...(defaults as ChartOptions<'matrix'>),
  animation: false,
  plugins: {
    ...defaults.plugins,
    legend: { display: false },
    tooltip: {
      ...defaults.plugins?.tooltip,
      displayColors: false,
      callbacks: {
        title: () => '',
        label: (item: TooltipItem<'matrix'>) => (item.raw as RetirementHeatmapPoint).description,
      },
    },
  },
  scales: {
    x: {
      type: 'category',
      labels: [...yearLabels.value],
      offset: true,
      position: 'top',
      grid: { display: false },
      ticks: { ...defaults.scales?.x?.ticks, maxRotation: 0, autoSkip: true },
    },
    y: {
      type: 'category',
      labels: [...rowLabels.value],
      // The matrix plugin reverses y by default; draw the first (busiest) group on top.
      reverse: false,
      offset: true,
      grid: { display: false },
      ticks: { ...defaults.scales?.y?.ticks, autoSkip: false },
    },
  },
}))
</script>

<template>
  <UEmpty
    v-if="!hasData"
    icon="i-lucide-grid-3x3"
    title="No seniority list loaded"
    description="Import your airline's seniority list to see where retirements fall."
    :actions="[{ label: 'Import a list', icon: 'i-lucide-file-input', to: '/seniority/upload', size: 'lg' as const }]"
    class="py-24"
  />

  <UCard v-else>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <h2 class="text-lg font-semibold text-highlighted">Retirement heatmap</h2>
          <p class="text-sm text-muted">{{ scopeLabel }} · {{ groupedByLabel }} · {{ yearRangeLabel }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div role="group" aria-label="Group rows by" class="flex items-center gap-1.5">
            <span class="text-sm text-muted">Group by</span>
            <UButton
              v-for="dimension in dimensions"
              :key="dimension.value"
              :label="dimension.label"
              :aria-pressed="dimension.selected"
              :color="dimension.selected ? 'primary' : 'neutral'"
              :variant="dimension.selected ? 'solid' : 'outline'"
              size="xs"
              @click="toggleDimension(dimension.value)"
            />
          </div>
          <div class="flex items-center gap-1.5">
            <label for="heatmap-sort" class="text-sm text-muted">Sort rows</label>
            <USelect id="heatmap-sort" v-model="sortBy" :items="[...sortItems]" value-key="value" label-key="label" size="xs" class="w-44" />
          </div>
          <label class="flex items-center gap-2 text-sm text-muted">
            <AppSwitch v-model="showPercent" size="xs" />
            Cells as % of group
          </label>
          <div class="flex items-center gap-x-3">
            <USlider v-model="sliderYears" :min="1" :max="maxYears" :step="1" size="sm" class="w-32 sm:w-44" aria-label="Years shown" />
            <span class="whitespace-nowrap font-mono text-sm font-semibold text-highlighted" aria-live="polite">{{ sliderLabel }}</span>
          </div>
        </div>
      </div>
    </template>

    <p v-if="isEmpty" class="py-12 text-center text-sm text-muted">
      No scheduled retirements in {{ scopeLabel }}.
    </p>

    <div v-else class="space-y-3">
      <p class="text-xs text-muted">{{ valueLegend }}. Stronger cells hold more. Tap or hover a cell for its figures.</p>
      <div class="max-h-[640px] overflow-auto">
        <div :style="{ height: `${chartHeight}px`, minWidth: `${chartMinWidth}px` }">
          <Chart type="matrix" :data="chartData" :options="chartOptions" role="img" :aria-label="summaryLabel" />
        </div>
      </div>
      <p v-if="undatedPilotNote" class="text-xs text-muted">{{ undatedPilotNote }}</p>
    </div>
  </UCard>
</template>
