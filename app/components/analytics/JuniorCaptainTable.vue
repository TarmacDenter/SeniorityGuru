<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { formatDate } from '~/utils/date'
import type { PlainDate } from '~/utils/temporal'

interface TableRow {
  qualificationLabel: string
  base: string | null
  seniorityNumber: number
  hireDate: PlainDate
  yos: number
  modeledHoldable: boolean
}

defineProps<{
  rows: TableRow[]
}>()

const columns: TableColumn<TableRow>[] = [
  {
    accessorKey: 'qualificationLabel',
    header: 'Qual',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.qualificationLabel),
        row.original.modeledHoldable
          ? h('span', {
              class: 'inline-block size-2 rounded-full bg-[var(--ui-color-success-500)]',
              title: 'You could hold this today',
            })
          : null,
      ]),
  },
  { accessorKey: 'seniorityNumber', header: 'Sen #' },
  { accessorKey: 'hireDate', header: 'Hire Date', cell: ({ row }) => formatDate(row.original.hireDate) },
  {
    accessorKey: 'yos',
    header: 'YOS',
    cell: ({ row }) => `${row.original.yos.toFixed(1)} yrs`,
  },
]
</script>

<template>
  <UTable :data="rows" :columns="columns" />
</template>
