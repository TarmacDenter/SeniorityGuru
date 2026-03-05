<template>
  <div class="space-y-4">
    <UTable
      v-model:pagination="pagination"
      :data="entries"
      :columns="columns"
      :get-row-id="(_row: Partial<SeniorityEntry>, index: number) => String(index)"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
      class="w-full"
      :ui="{ tr: 'data-[error=true]:bg-error/10' }"
    />
    <div v-if="pageCount > 1" class="flex justify-center">
      <UPagination
        v-model:page="currentPage"
        :total="entries.length"
        :items-per-page="pagination.pageSize"
        :sibling-count="1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import type { TableColumn } from '@nuxt/ui'

const PAGE_SIZE = 50

const props = defineProps<{
  entries: Partial<SeniorityEntry>[]
  rowErrors: Map<number, string[]>
}>()

const pagination = ref({ pageIndex: 0, pageSize: PAGE_SIZE })
const pageCount = computed(() => Math.ceil(props.entries.length / pagination.value.pageSize))
const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (p: number) => { pagination.value = { ...pagination.value, pageIndex: p - 1 } },
})

const emit = defineEmits<{
  updateCell: [rowIndex: number, field: keyof SeniorityEntry, value: string | number]
  deleteRow: [rowIndex: number]
}>()

function makeEditableCell(field: keyof SeniorityEntry) {
  return ({ row }: { row: { original: Partial<SeniorityEntry>; index: number } }) => {
    const value = row.original[field]
    const rowIndex = row.index
    const hasError = props.rowErrors.has(rowIndex)
    const isNumber = field === 'seniority_number'
    const componentName = isNumber ? 'UInputNumber' : 'UInput'

    return h(resolveComponent(componentName), {
      id: `cell-${field}-${rowIndex}`,
      name: `${field}-${rowIndex}`,
      modelValue: value ?? (isNumber ? undefined : ''),
      size: 'xs',
      class: 'w-full',
      color: hasError ? 'error' : undefined,
      'onUpdate:modelValue': (newVal: string | number | null) => {
        const parsed = isNumber
          ? (typeof newVal === 'number' ? newVal : parseInt(String(newVal ?? ''), 10))
          : String(newVal ?? '')
        emit('updateCell', rowIndex, field, parsed)
      },
    })
  }
}

const columns: TableColumn<Partial<SeniorityEntry>>[] = [
  { accessorKey: 'seniority_number', header: 'Sen #', cell: makeEditableCell('seniority_number') },
  { accessorKey: 'employee_number', header: 'Emp #', cell: makeEditableCell('employee_number') },
  { accessorKey: 'name', header: 'Name', cell: makeEditableCell('name') },
  { accessorKey: 'seat', header: 'Seat', cell: makeEditableCell('seat') },
  { accessorKey: 'base', header: 'Base', cell: makeEditableCell('base') },
  { accessorKey: 'fleet', header: 'Fleet', cell: makeEditableCell('fleet') },
  { accessorKey: 'hire_date', header: 'Hire Date', cell: makeEditableCell('hire_date') },
  { accessorKey: 'retire_date', header: 'Retire Date', cell: makeEditableCell('retire_date') },
  {
    id: 'errors',
    header: '',
    cell: ({ row }) => {
      const errs = props.rowErrors.get(row.index)
      if (!errs) return null
      return h(resolveComponent('UIcon'), {
        name: 'i-lucide-alert-triangle',
        class: 'text-error',
        title: errs.join('\n'),
      })
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(resolveComponent('UButton'), {
        icon: 'i-lucide-trash-2',
        color: 'error',
        variant: 'ghost',
        size: 'xs',
        'aria-label': 'Delete row',
        onClick: () => emit('deleteRow', row.index),
      })
    },
  },
]
</script>
