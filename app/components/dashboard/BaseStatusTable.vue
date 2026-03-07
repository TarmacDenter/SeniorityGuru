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

    <UTable :data="displayData" :columns="columns">
      <template #base-cell="{ row }">
        <span :class="row.original.isUserCurrent ? 'font-bold text-primary' : ''">
          {{ row.original.base }}
        </span>
      </template>
      <template #seat-cell="{ row }">
        <span :class="row.original.isUserCurrent ? 'font-bold text-primary' : ''">
          {{ row.original.seat }}
        </span>
      </template>
      <template #fleet-cell="{ row }">
        <span :class="row.original.isUserCurrent ? 'font-bold text-primary' : ''">
          {{ row.original.fleet }}
        </span>
      </template>
      <template #displayRank-cell="{ row }">
        <span :class="row.original.isUserCurrent ? 'font-bold text-primary' : ''">
          {{ row.original.displayRank }}
        </span>
      </template>
      <template #displayTotal-cell="{ row }">
        <span :class="row.original.isUserCurrent ? 'font-bold text-primary' : ''">
          {{ row.original.displayTotal }}
        </span>
      </template>
      <template #displayPercentile-cell="{ row }">
        <span :class="row.original.isUserCurrent ? 'font-bold text-primary' : ''">
          {{ row.original.displayPercentile }}%
        </span>
      </template>
    </UTable>
  </UCard>
</template>

<script setup lang="ts">
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

const columns: TableColumn<DisplayRow>[] = [
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'fleet', header: 'Fleet' },
  { accessorKey: 'displayRank', header: 'Rank' },
  { accessorKey: 'displayTotal', header: 'Total' },
  { accessorKey: 'displayPercentile', header: 'TOP %' },
]
</script>
