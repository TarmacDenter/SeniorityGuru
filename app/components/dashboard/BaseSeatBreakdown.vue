<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">Base / Seat Ranking</h3>
    </template>

    <UTabs :items="tabs" class="w-full">
      <template #content="{ item }">
        <div class="overflow-x-auto mt-2">
          <UTable
            :data="filteredData(item.value as string)"
            :columns="columns"
          />
        </div>
      </template>
    </UTabs>
  </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
  data: Array<{
    base: string
    seat: string
    rank: number
    total: number
    percentile: number
  }>
}>()

const tabs = [
  { label: 'Captain', value: 'CA' },
  { label: 'First Officer', value: 'FO' }
]

type BaseSeatRow = (typeof props.data)[number]

const columns: TableColumn<BaseSeatRow>[] = [
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'rank', header: 'Rank' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'percentile', header: '%ile' }
]

function filteredData(seat: string) {
  return props.data.filter(row => row.seat === seat)
}
</script>
