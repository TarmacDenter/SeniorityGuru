<template>
  <UTable :data="tableRows" :columns="columns" />
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'

interface TableRow {
  qualKey: string
  base: string | null
  seniorityNumber: number
  hireDate: string
  yos: number
  isHoldable: boolean
}

const props = defineProps<{
  rows: { qualKey: string; fleet: string; seat: string; base: string | null; seniorityNumber: number; hireDate: string; yos: number }[]
  userSeniorityNumber: number | undefined
}>()

const tableRows = computed<TableRow[]>(() =>
  props.rows.map((r) => ({
    ...r,
    isHoldable:
      props.userSeniorityNumber !== undefined &&
      props.userSeniorityNumber <= r.seniorityNumber,
  })),
)

const columns: TableColumn<TableRow>[] = [
  {
    accessorKey: 'qualKey',
    header: 'Qual',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.qualKey),
        row.original.isHoldable
          ? h('span', {
              class: 'inline-block size-2 rounded-full bg-[var(--ui-color-success-500)]',
              title: 'You could hold this today',
            })
          : null,
      ]),
  },
  { accessorKey: 'seniorityNumber', header: 'Sen #' },
  { accessorKey: 'hireDate', header: 'Hire Date' },
  {
    accessorKey: 'yos',
    header: 'YOS',
    cell: ({ row }) => `${row.original.yos.toFixed(1)} yrs`,
  },
]
</script>
