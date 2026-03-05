<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">Fleet / Base Averages</h3>
    </template>

    <UTable :data="data" :columns="columns" />
  </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
  data: Array<{
    category: string
    avgSeniority: number
    avgYearsToRetire: number
    totalPilots: number
  }>
}>()

type AggRow = (typeof props.data)[number]

const columns: TableColumn<AggRow>[] = [
  { accessorKey: 'category', header: 'Fleet / Base' },
  { accessorKey: 'avgSeniority', header: 'Avg Sen #' },
  { accessorKey: 'avgYearsToRetire', header: 'Avg Yrs to Retire' },
  { accessorKey: 'totalPilots', header: 'Pilots' }
]
</script>
