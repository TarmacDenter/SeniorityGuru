<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">Status by Base / Seat / Fleet</h3>
    </template>

    <UTable :data="data" :columns="columns">
      <template #base-cell="{ row }">
        <span :class="row.original.isUserCurrent ? 'font-bold text-primary' : ''">
          {{ row.original.base }}
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
  percentile: number
  isUserCurrent: boolean
}

defineProps<{
  data: BaseStatusRow[]
}>()

const columns: TableColumn<BaseStatusRow>[] = [
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'fleet', header: 'Fleet' },
  { accessorKey: 'adjustedRank', header: 'Rank' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'percentile', header: '%ile' },
]
</script>
