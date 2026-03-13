<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">Fleet / Base Averages</h3>
    </template>

    <div class="overflow-x-auto">
      <UTable :data="data" :columns="columns" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface AggRow {
  category: string
  avgSeniority: number
  avgYearsToRetire: number
  totalPilots: number
}

defineProps<{
  data: AggRow[]
}>()

const columns: TableColumn<AggRow>[] = [
  { accessorKey: 'category', header: 'Fleet / Base' },
  { accessorKey: 'avgSeniority', header: 'Avg Sen #' },
  { accessorKey: 'avgYearsToRetire', header: 'Avg Yrs to Retire' },
  { accessorKey: 'totalPilots', header: 'Pilots' }
]
</script>
