<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { DiffRow } from '~/utils/build-diff-rows'
import { presentDiffRows } from '~/utils/diff-row-presentation'
import type { DiffRowView } from '~/utils/diff-row-presentation'

const props = defineProps<{
  rows: DiffRow[]
  userEmployeeNumber?: string
}>()

const showSeniorityNumberChanges = ref(false)

const viewRows = computed(() => presentDiffRows(props.rows, {
  showSeniorityNumberChanges: showSeniorityNumberChanges.value,
  userEmployeeNumber: props.userEmployeeNumber,
}))

const table = useTableFeatures<DiffRowView>('diffTable', { pageSize: 50 })

watch(showSeniorityNumberChanges, () => { table.pagination.value.pageIndex = 0 })

const columns: TableColumn<DiffRowView>[] = [
  { accessorKey: 'seniorityNumber', header: 'Seniority Number', meta: { class: { th: 'text-right', td: 'text-right font-mono' } } },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'qualification', header: 'Qualification', meta: { class: { th: 'hidden sm:table-cell', td: 'hidden sm:table-cell font-mono' } } },
  { id: 'change', header: 'Change', meta: { class: { th: 'text-right', td: 'text-right' } } },
]
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label class="inline-flex items-center gap-2 text-sm text-muted">
        <AppSwitch
          v-model="showSeniorityNumberChanges"
          size="sm"
          data-testid="seniority-number-change-toggle"
        />
        Show Seniority Number changes
      </label>
      <p class="text-xs text-muted">Delta = older Seniority Number − newer Seniority Number.</p>
    </div>

    <SeniorityAnchoredTable
      ref="diffTable"
      v-model:pagination="table.pagination.value"
      :data="viewRows"
      :columns="columns"
      mark-column="name"
      :get-row-id="(row: DiffRowView) => row.key"
      :pagination-options="table.paginationOptions"
      :ui="{ caption: 'sr-only', td: 'whitespace-normal' }"
      caption="Changes between the two lists"
    >
      <template #empty>
        <p class="py-8 text-center text-muted">No changes between these lists</p>
      </template>

      <template #change-cell="{ row }">
        <UPopover>
          <button type="button" class="cursor-pointer" :aria-label="`Details for ${row.original.name}`">
            <UBadge color="neutral" variant="outline" size="sm">{{ row.original.change }}</UBadge>
          </button>

          <template #content>
            <div class="min-w-32 space-y-1.5 p-3 text-xs sm:min-w-48">
              <div class="mb-2 font-semibold text-highlighted">{{ row.original.name }}</div>
              <div v-for="detail in row.original.details" :key="detail.label" class="text-muted">
                {{ detail.label }}: <span class="text-default">{{ detail.value }}</span>
              </div>
            </div>
          </template>
        </UPopover>
      </template>
    </SeniorityAnchoredTable>

    <TablePagination
      v-if="viewRows.length"
      :current-page="table.currentPage.value"
      :page-count="table.pageCount.value"
      :total-rows="table.totalRows.value"
      :page-size="table.pagination.value.pageSize"
      @update:page="(p: number) => table.tableRef.value?.tableApi?.setPageIndex(p - 1)"
    />
  </div>
</template>
