<template>
  <div>
    <UTable :data="tableRows" :columns="columns" />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'

interface YosRow {
  label: string
  value: string
  isUser: boolean
}

const props = defineProps<{
  distribution: {
    entryFloor: number
    p25: number
    median: number
    p75: number
    max: number
  }
  userYos: number | undefined
}>()

const columns: TableColumn<YosRow>[] = [
  {
    accessorKey: 'label',
    header: 'Metric',
    cell: ({ row }) =>
      h('span', { class: row.original.isUser ? 'font-semibold text-primary' : '' }, row.original.label),
  },
  {
    accessorKey: 'value',
    header: 'Years of Service',
    cell: ({ row }) =>
      h('span', { class: row.original.isUser ? 'font-semibold text-primary' : '' }, row.original.value),
  },
]

const tableRows = computed<YosRow[]>(() => {
  const rows: YosRow[] = [
    { label: 'Entry Floor (Most Junior)', value: `${props.distribution.entryFloor.toFixed(1)} yrs`, isUser: false },
    { label: 'P25', value: `${props.distribution.p25.toFixed(1)} yrs`, isUser: false },
    { label: 'Median (P50)', value: `${props.distribution.median.toFixed(1)} yrs`, isUser: false },
    { label: 'P75', value: `${props.distribution.p75.toFixed(1)} yrs`, isUser: false },
    { label: 'Max (Most Senior)', value: `${props.distribution.max.toFixed(1)} yrs`, isUser: false },
  ]
  if (props.userYos !== undefined) {
    rows.push({ label: 'Your YOS', value: `${props.userYos.toFixed(1)} yrs`, isUser: true })
  }
  return rows
})
</script>
