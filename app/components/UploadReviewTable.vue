<template>
  <div class="space-y-4">
    <div class="overflow-x-auto">
    <UTable
      v-model:pagination="pagination"
      :data="displayEntries"
      :columns="columns"
      :get-row-id="(row: IndexedEntry) => String(row._originalIndex)"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
      class="w-full"
      :ui="{ tr: 'data-[error=true]:bg-error/10' }"
    >
      <template v-for="field in editableFields" :key="field" #[`${field}-cell`]="{ row }">
        <div class="cursor-pointer" @click="startEditing(row.original._originalIndex, field)">
          <template v-if="isEditing(row.original._originalIndex, field)">
            <UInputNumber
              v-if="field === 'seniority_number'"
              :model-value="(row.original[field] as number | undefined)"
              size="xs"
              class="w-full"
              :color="rowErrors.has(row.original._originalIndex) ? 'error' : undefined"
              autofocus
              @update:model-value="(v: number | null) => emit('updateCell', row.original._originalIndex, field, v ?? 0)"
              @blur="stopEditing"
              @keydown.enter="stopEditing"
              @keydown.escape="stopEditing"
            />
            <UInput
              v-else
              :model-value="String(row.original[field] ?? '')"
              size="xs"
              class="w-full"
              :color="rowErrors.has(row.original._originalIndex) ? 'error' : undefined"
              autofocus
              @update:model-value="(v: string) => emit('updateCell', row.original._originalIndex, field, v)"
              @blur="stopEditing"
              @keydown.enter="stopEditing"
              @keydown.escape="stopEditing"
            />
          </template>
          <span v-else class="text-sm" :class="rowErrors.has(row.original._originalIndex) ? 'text-error' : ''">
            {{ row.original[field] ?? '' }}
          </span>
        </div>
      </template>

      <template #errors-cell="{ row }">
        <UTooltip v-if="rowErrors.has(row.original._originalIndex)">
          <UIcon name="i-lucide-alert-triangle" class="text-error" />
          <template #text>
            <ul class="list-disc pl-3 text-xs space-y-0.5">
              <li v-for="(err, i) in rowErrors.get(row.original._originalIndex)" :key="i">{{ formatRowError(err) }}</li>
            </ul>
          </template>
        </UTooltip>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          aria-label="Delete row"
          @click="emit('deleteRow', row.original._originalIndex)"
        />
      </template>
    </UTable>
    </div>

    <div v-if="pageCount > 1" class="flex justify-center">
      <UPagination
        v-model:page="currentPage"
        :total="displayEntries.length"
        :items-per-page="pagination.pageSize"
        :sibling-count="1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import type { TableColumn } from '@nuxt/ui'
import { formatRowError } from '~/utils/formatRowError'

const PAGE_SIZE = 50

type IndexedEntry = Partial<SeniorityEntry> & { _originalIndex: number }

const props = defineProps<{
  entries: Partial<SeniorityEntry>[]
  rowErrors: Map<number, string[]>
  showErrorsOnly?: boolean
}>()

const pagination = ref({ pageIndex: 0, pageSize: PAGE_SIZE })

const displayEntries = computed<IndexedEntry[]>(() => {
  const indexed = props.entries.map((entry, i) => ({ ...entry, _originalIndex: i }))
  if (!props.showErrorsOnly) return indexed
  return indexed.filter(e => props.rowErrors.has(e._originalIndex))
})

const pageCount = computed(() => Math.ceil(displayEntries.value.length / pagination.value.pageSize))

// Reset to page 1 when toggling error filter
watch(() => props.showErrorsOnly, () => {
  pagination.value = { ...pagination.value, pageIndex: 0 }
})
const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (p: number) => { pagination.value = { ...pagination.value, pageIndex: p - 1 } },
})

const emit = defineEmits<{
  updateCell: [rowIndex: number, field: keyof SeniorityEntry, value: string | number]
  deleteRow: [rowIndex: number]
}>()

const editingCell = ref<{ row: number; field: string } | null>(null)

const editableFields: (keyof SeniorityEntry)[] = [
  'seniority_number', 'employee_number', 'name', 'seat', 'base', 'fleet', 'hire_date', 'retire_date',
]

function isEditing(rowIndex: number, field: string) {
  return editingCell.value?.row === rowIndex && editingCell.value?.field === field
}

function startEditing(rowIndex: number, field: string) {
  editingCell.value = { row: rowIndex, field }
}

function stopEditing() {
  editingCell.value = null
}

const columns: TableColumn<IndexedEntry>[] = [
  { accessorKey: 'seniority_number', header: 'Sen #' },
  { accessorKey: 'employee_number', header: 'Emp #' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'fleet', header: 'Fleet' },
  { accessorKey: 'hire_date', header: 'Hire Date' },
  { accessorKey: 'retire_date', header: 'Retire Date' },
  { id: 'errors', header: '' },
  { id: 'actions', header: '' },
]
</script>
