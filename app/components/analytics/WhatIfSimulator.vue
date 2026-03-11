<template>
  <div>
    <!-- No employee number set -->
    <UAlert
      v-if="!userEntry"
      icon="i-lucide-user-x"
      color="neutral"
      variant="subtle"
      title="Employee Number Not Set"
      description="Set your employee number in Settings to use the What-If Simulator."
      class="mb-4"
    />

    <!-- Target qual selectors -->
    <div class="flex gap-3 flex-wrap mb-4">
      <USelect
        :model-value="targetFleet ?? undefined"
        :options="availableFleets"
        placeholder="Target Fleet"
        class="w-40"
        @update:model-value="(v) => $emit('update:targetFleet', typeof v === 'string' ? v : null)"
      />
      <USelect
        :model-value="targetSeat ?? undefined"
        :options="availableSeats"
        placeholder="Target Seat"
        class="w-40"
        @update:model-value="(v) => $emit('update:targetSeat', typeof v === 'string' ? v : null)"
      />
      <UButton
        v-if="targetFleet || targetSeat"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        size="sm"
        @click="clearTarget"
      >
        Clear
      </UButton>
    </div>

    <!-- Chart -->
    <ClientOnly>
      <DashboardChart
        type="line"
        :data="chartData"
        :height="280"
        :options="chartOptions"
      />
      <template #fallback>
        <USkeleton class="h-[280px] w-full" />
      </template>
    </ClientOnly>

    <!-- Summary callout -->
    <div
      v-if="userEntry && trajectory.labels.length > 0"
      class="mt-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-4 py-3 text-sm text-[var(--ui-text-muted)]"
    >
      <template v-if="targetFleet || targetSeat">
        In 5 years, you'd be in the top
        <span class="font-semibold text-[var(--ui-text-highlighted)]">{{ fiveYearTarget }}%</span>
        of {{ targetLabel }} vs. top
        <span class="font-semibold text-[var(--ui-text-highlighted)]">{{ fiveYearCurrent }}%</span>
        of {{ currentLabel }}.
      </template>
      <template v-else>
        Select a target fleet and seat above to compare your projected seniority percentile.
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartData } from 'chart.js'

const props = defineProps<{
  trajectory: { labels: string[]; currentData: number[]; targetData: number[] }
  targetFleet: string | null
  targetSeat: string | null
  availableFleets: string[]
  availableSeats: string[]
  userEntry: { fleet: string | null; seat: string | null } | undefined
}>()

const emit = defineEmits<{
  'update:targetFleet': [string | null]
  'update:targetSeat': [string | null]
}>()

const { colors } = useChartTheme()

function clearTarget() {
  emit('update:targetFleet', null)
  emit('update:targetSeat', null)
}

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.trajectory.labels,
  datasets: [
    {
      label: `Current (${props.userEntry?.fleet ?? '—'} ${props.userEntry?.seat ?? '—'})`,
      data: props.trajectory.currentData,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHitRadius: 10,
    },
    {
      label: `Target (${props.targetFleet ?? 'Any'} ${props.targetSeat ?? 'Any'})`,
      data: props.trajectory.targetData,
      borderColor: colors.cyan,
      backgroundColor: colors.cyanLight,
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      pointHitRadius: 10,
      borderDash: [5, 3],
    },
  ],
}))

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
          const label = props.trajectory.labels[index]
          if (!label) return ''
          return new Date(label).getFullYear().toString()
        },
      },
    },
    y: {
      min: 0,
      max: 100,
      title: { display: true, text: 'Seniority %ile' },
      ticks: { callback: (v: any) => `${v}%` },
    },
  },
}

// 5-year data point (index 4, i.e. 5th year)
const fiveYearCurrent = computed(() => {
  const val = props.trajectory.currentData[4]
  return val !== undefined ? val.toFixed(1) : '—'
})

const fiveYearTarget = computed(() => {
  const val = props.trajectory.targetData[4]
  return val !== undefined ? val.toFixed(1) : '—'
})

const currentLabel = computed(() =>
  [props.userEntry?.fleet, props.userEntry?.seat].filter(Boolean).join(' ') || 'current qual',
)

const targetLabel = computed(() =>
  [props.targetFleet, props.targetSeat].filter(Boolean).join(' ') || 'target qual',
)
</script>
