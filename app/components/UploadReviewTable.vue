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
    >
      <template v-for="field in editableFields" :key="field" #[`${field}-cell`]="{ row }">
        <div class="cursor-pointer" @click="startEditing(row.index, field)">
          <template v-if="isEditing(row.index, field)">
            <UInputNumber
              v-if="field === 'seniority_number'"
              :model-value="(row.original[field] as number | undefined)"
              size="xs"
              class="w-full"
              :color="rowErrors.has(row.index) ? 'error' : undefined"
              autofocus
              @update:model-value="(v: number | null) => emit('updateCell', row.index, field, v ?? 0)"
              @blur="stopEditing"
              @keydown.enter="stopEditing"
              @keydown.escape="stopEditing"
            />
            <UInput
              v-else
              :model-value="String(row.original[field] ?? '')"
              size="xs"
              class="w-full"
              :color="rowErrors.has(row.index) ? 'error' : undefined"
              autofocus
              @update:model-value="(v: string) => emit('updateCell', row.index, field, v)"
              @blur="stopEditing"
              @keydown.enter="stopEditing"
              @keydown.escape="stopEditing"
            />
          </template>
          <span v-else class="text-sm" :class="rowErrors.has(row.index) ? 'text-error' : ''">
            {{ row.original[field] ?? '' }}
          </span>
        </div>
      </template>

      <template #errors-cell="{ row }">
        <UIcon
          v-if="rowErrors.has(row.index)"
          name="i-lucide-alert-triangle"
          class="text-error"
          :title="rowErrors.get(row.index)?.join('\n')"
        />
      </template>

      <template #actions-cell="{ row }">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          aria-label="Delete row"
          @click="emit('deleteRow', row.index)"
        />
      </template>
    </UTable>

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

const columns: TableColumn<Partial<SeniorityEntry>>[] = [
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
