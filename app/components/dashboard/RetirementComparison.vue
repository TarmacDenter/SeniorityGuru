<script setup lang="ts">
import type { ChartData } from 'chart.js'
import type { QualificationScope, SeniorityQualificationScopeOption } from '~/utils/seniority'

const props = defineProps<{
  qualificationScopeOptions: readonly SeniorityQualificationScopeOption[]
  computeProjection: (scope: QualificationScope) => { labels: string[]; data: number[]; scopedPilotCount: number }
}>()

const { colors } = useChartTheme()
const qualificationScopeOptions = computed(() => props.qualificationScopeOptions)
const { scopeOptions, specForLabel } = useScopeFilter(qualificationScopeOptions)

const currentScope = ref('Company-wide')
const compareScope = ref('')
const showPercentage = ref(false)

function toPercentages(data: number[], scopedPilotCount: number): number[] {
  let remaining = scopedPilotCount
  return data.map((count) => {
    const pct = remaining > 0 ? Math.round((count / remaining) * 1000) / 10 : 0
    remaining -= count
    return pct
  })
}

const chartData = computed<ChartData<'bar'>>(() => {
  const current = props.computeProjection(specForLabel(currentScope.value))
  const currentData = showPercentage.value
    ? toPercentages(current.data, current.scopedPilotCount)
    : current.data

  const datasets: ChartData<'bar'>['datasets'] = [{
    label: currentScope.value || 'Company-wide',
    data: currentData,
    backgroundColor: 'rgba(56, 189, 248, 0.5)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 4,
  }]

  if (compareScope.value && compareScope.value !== currentScope.value) {
    const compare = props.computeProjection(specForLabel(compareScope.value))
    const compareData = showPercentage.value
      ? toPercentages(compare.data, compare.scopedPilotCount)
      : compare.data

    datasets.push({
      label: compareScope.value,
      data: compareData,
      backgroundColor: colors.cyanLight,
      borderColor: colors.cyan,
      borderWidth: 1,
      borderRadius: 4,
    })
  }

  return { labels: current.labels, datasets }
})

const chartOptions = computed(() => ({
  scales: {
    y: showPercentage.value
      ? { title: { display: true, text: '% of remaining pilots' }, ticks: { callback: (v: string | number) => `${v}%` } }
      : {},
  },
}))
</script>

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
          <USelect v-model="currentScope" :items="scopeOptions" size="xs" class="min-w-32 sm:min-w-40" placeholder="Current" />
          <span class="text-xs text-muted">vs</span>
          <USelect v-model="compareScope" :items="scopeOptions" size="xs" class="min-w-32 sm:min-w-40" placeholder="Compare" />
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
