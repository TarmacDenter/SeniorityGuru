<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'

interface ByBase {
  base: string
  count: number
  pct: number
}

interface QualCompositionRow {
  qualKey: string
  fleet: string
  seat: string
  total: number
  caCount: number
  foCount: number
  caFoRatio: number
  byBase: ByBase[]
}

const props = defineProps<{
  composition: QualCompositionRow[]
}>()

interface SizeRow {
  fleet: string
  seat: string
  base: string
  count: number
}

const rows = computed<SizeRow[]>(() => {
  const result: SizeRow[] = []
  for (const qual of props.composition) {
    if (!qual.byBase?.length) {
      result.push({ fleet: qual.fleet, seat: qual.seat, base: '—', count: qual.total })
    }
    else {
      for (const b of qual.byBase) {
        result.push({ fleet: qual.fleet, seat: qual.seat, base: b.base, count: b.count })
      }
    }
  }
  return result.sort((a, b) => {
    const seatDiff = a.seat.localeCompare(b.seat)
    if (seatDiff !== 0) return seatDiff
    const fleetDiff = a.fleet.localeCompare(b.fleet)
    if (fleetDiff !== 0) return fleetDiff
    return a.base.localeCompare(b.base)
  })
})

const columns: TableColumn<SizeRow>[] = [
  { accessorKey: 'fleet', header: 'Fleet' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'base', header: 'Base' },
  {
    accessorKey: 'count',
    header: 'Pilots',
    cell: ({ row }) => h('span', { class: 'font-mono' }, row.original.count.toLocaleString()),
  },
]
</script>

<template>
  <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-5' }">
    <template #header>
      <h3 class="font-semibold">Base / Fleet / Seat Sizes</h3>
    </template>
    <UTable :data="rows" :columns="columns" class="text-xs sm:text-sm" />
  </UCard>
</template>
