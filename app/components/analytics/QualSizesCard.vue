<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { QualificationSizeRow } from '~/composables/seniority'

// Pilots per fleet, seat and base. Rows arrive sorted with their counts formatted.
defineProps<{
  rows: QualificationSizeRow[]
}>()

const columns: TableColumn<QualificationSizeRow>[] = [
  { accessorKey: 'fleet', header: 'Fleet' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'countLabel', header: 'Pilots', meta: { class: { th: 'text-right', td: 'text-right font-mono' } } },
]
</script>

<template>
  <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-3' }">
    <template #header>
      <h3 class="font-semibold text-highlighted">Sizes</h3>
    </template>
    <UTable :data="rows" :columns="columns" :ui="{ th: 'py-2', td: 'py-1.5' }" class="text-xs sm:text-sm" />
  </UCard>
</template>
