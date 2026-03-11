<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-highlighted">Status by Base / Seat / Fleet</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted">Adjust for retirements</span>
          <USwitch v-model="adjusted" size="xs" />
        </div>
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable :data="displayData" :columns="columns" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type BaseStatusRow = {
  base: string
  seat: string
  fleet: string
  rank: number
  adjustedRank: number
  total: number
  adjustedTotal: number
  percentile: number
  adjustedPercentile: number
  isUserCurrent: boolean
}

type DisplayRow = BaseStatusRow & {
  displayRank: number
  displayTotal: number
  displayPercentile: number
}

const props = defineProps<{
  data: BaseStatusRow[]
}>()

const adjusted = ref(true)

const displayData = computed<DisplayRow[]>(() =>
  props.data.map((row) => ({
    ...row,
    displayRank: adjusted.value ? row.adjustedRank : row.rank,
    displayTotal: adjusted.value ? row.adjustedTotal : row.total,
    displayPercentile: adjusted.value ? row.adjustedPercentile : row.percentile,
  })),
)

function highlightClass(row: DisplayRow): string {
  return row.isUserCurrent ? 'font-bold text-primary' : ''
}

const columns: TableColumn<DisplayRow>[] = [
  { accessorKey: 'base', header: 'Base', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.base) },
  { accessorKey: 'seat', header: 'Seat', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.seat) },
  { accessorKey: 'fleet', header: 'Fleet', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.fleet) },
  { accessorKey: 'displayRank', header: 'Rank', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.displayRank) },
  { accessorKey: 'displayTotal', header: 'Total', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.displayTotal) },
  { accessorKey: 'displayPercentile', header: 'TOP %', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, `${row.original.displayPercentile}%`) },
]
</script>
