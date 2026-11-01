<script setup lang="ts" generic="T extends { isAnchor: boolean, status?: string }">
import { h } from 'vue'
import type { Row, Table } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'

// The one shared table for Seniority List rows: a stock UTable with the Anchor Pilot's line marked
// by highlighter, a left bar and bold weight, and named for screen readers. Retired pilots are struck through.
// Other UTable props, v-models and slots pass straight through.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  data: T[]
  columns: TableColumn<T>[]
  /** Column whose cell carries the screen-reader "Your line" marker. */
  markColumn: string
  /** Extra classes for a row, such as retirement proximity. The anchor mark wins. */
  rowClass?: (row: T) => string
}>()

const ANCHOR_ROW = 'bg-mark [&>td]:font-bold [&>td]:text-mark-ink [&_td_*]:text-mark-ink [&>td:first-child]:shadow-[inset_4px_0_0_var(--ui-text-highlighted)]'
const RETIRED_ROW = '[&>td]:line-through [&>td]:text-muted'

const markedColumns = computed<TableColumn<T>[]>(() => props.columns.map((column) => {
  const id = column.id ?? ('accessorKey' in column ? String(column.accessorKey) : undefined)
  if (id !== props.markColumn) return column
  const cell = column.cell
  return {
    ...column,
    cell: (context) => {
      const content = typeof cell === 'function' ? cell(context) : context.getValue() as string
      if (!context.row.original.isAnchor) return content
      return h('span', null, [content, h('span', { class: 'sr-only' }, ' (Your line)')])
    },
  } as TableColumn<T>
}))

const meta = {
  class: {
    tr: (row: Row<T>) => {
      if (row.original.isAnchor) return ANCHOR_ROW
      return [row.original.status === 'retired' ? RETIRED_ROW : '', props.rowClass?.(row.original) ?? ''].join(' ').trim()
    },
  },
}

const table = useTemplateRef<{ tableApi: Table<T>, $el: HTMLElement }>('table')
defineExpose({
  get tableApi() { return table.value?.tableApi },
  get $el() { return table.value?.$el },
})
</script>

<template>
  <UTable ref="table" v-bind="$attrs" :data="data" :columns="markedColumns" :meta="meta">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </UTable>
</template>
