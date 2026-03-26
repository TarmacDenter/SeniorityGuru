<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { formatRankDelta } from '~/utils/seniority-math'
import { formatMonthYear, formatYear } from '~/utils/date'

interface TrajectoryPoint {
  date: string
  rank: number
  percentile: number
}

const props = defineProps<{
  snapshot: {
    atRetirement: TrajectoryPoint
    fullTrajectory: TrajectoryPoint[]
    retireDate: string
  }
}>()

const DEFAULT_YEARS = 5
const MIN_YEARS = 3
const MAX_YEARS = 10

const maxYears = computed(() => Math.min(MAX_YEARS, props.snapshot.fullTrajectory.length))
const yearsToShow = ref(Math.min(DEFAULT_YEARS, maxYears.value))

watch(maxYears, (newMax) => {
  if (yearsToShow.value > newMax) {
    yearsToShow.value = newMax
  }
  if (yearsToShow.value < MIN_YEARS && newMax >= MIN_YEARS) {
    yearsToShow.value = MIN_YEARS
  }
})

interface TableRow {
  year: string
  rank: number
  percentile: number
  rankDelta: string
}

const tableData = computed<TableRow[]>(() => {
  const trajectory = props.snapshot.fullTrajectory
  const sliced = trajectory.slice(-yearsToShow.value)

  return sliced.map((point) => {
    const prevIndex = trajectory.indexOf(point) - 1
    const prev = prevIndex >= 0 ? trajectory[prevIndex] : null
    const delta = prev ? point.rank - prev.rank : 0

    return {
      year: formatYear(point.date),
      rank: point.rank,
      percentile: point.percentile,
      rankDelta: formatRankDelta(delta),
    }
  })
})

function rankDeltaColorClass(rankDelta: string): string {
  if (rankDelta.startsWith('-')) return 'text-[var(--ui-color-success-500)]'
  if (rankDelta.startsWith('+')) return 'text-[var(--ui-color-error-500)]'
  return 'text-[var(--ui-text-muted)]'
}

const columns: TableColumn<TableRow>[] = [
  { accessorKey: 'year', header: 'Year' },
  {
    accessorKey: 'rank',
    header: 'Rank',
    cell: ({ row }) => h('span', { class: 'font-mono' }, `#${row.original.rank.toLocaleString()}`),
  },
  {
    accessorKey: 'percentile',
    header: 'Percentile',
    cell: ({ row }) => h('span', { class: 'font-mono' }, `${row.original.percentile}%`),
  },
  {
    accessorKey: 'rankDelta',
    header: 'Change',
    cell: ({ row }) => h('span', { class: `font-mono ${rankDeltaColorClass(row.original.rankDelta)}` }, row.original.rankDelta),
  },
]

function formatDate(dateStr: string): string {
  return formatMonthYear(dateStr)
}
</script>

<template>
  <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-5' }">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 rounded-lg bg-primary/10">
            <UIcon name="i-lucide-plane-landing" class="size-5 text-primary" />
          </div>
          <h3 class="font-semibold text-highlighted">Retirement Snapshot</h3>
        </div>
        <UBadge color="primary" variant="subtle" size="sm">
          {{ formatDate(snapshot.retireDate) }}
        </UBadge>
      </div>
    </template>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 px-3 pt-3 sm:px-0 sm:pt-0">
      <div class="text-center">
        <p class="text-xs text-[var(--ui-text-muted)]">Retire Date</p>
        <p class="text-sm sm:text-lg font-semibold font-mono text-highlighted">{{ formatDate(snapshot.retireDate) }}</p>
      </div>
      <div class="text-center">
        <p class="text-xs text-[var(--ui-text-muted)]">Projected Rank</p>
        <p class="text-sm sm:text-lg font-semibold font-mono text-highlighted">#{{ snapshot.atRetirement.rank.toLocaleString() }}</p>
      </div>
      <div class="text-center">
        <p class="text-xs text-[var(--ui-text-muted)]">Percentile</p>
        <p class="text-sm sm:text-lg font-semibold font-mono text-highlighted">{{ snapshot.atRetirement.percentile }}%</p>
      </div>
      <div class="text-center">
        <p class="text-xs text-[var(--ui-text-muted)]">Pilots Ahead</p>
        <p class="text-sm sm:text-lg font-semibold font-mono text-highlighted">{{ (snapshot.atRetirement.rank - 1).toLocaleString() }}</p>
      </div>
    </div>

    <USeparator class="mb-3 sm:mb-4" />

    <div class="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 px-3 sm:px-0">
      <label class="text-xs sm:text-sm text-[var(--ui-text-muted)] whitespace-nowrap">Final years</label>
      <USlider v-model="yearsToShow" :min="3" :max="maxYears" :step="1" size="sm" class="flex-1" />
      <span class="text-xs sm:text-sm font-mono font-semibold text-highlighted w-5 sm:w-6 text-right">{{ yearsToShow }}</span>
    </div>

    <UTable :data="tableData" :columns="columns" class="text-xs sm:text-sm" />
  </UCard>
</template>
