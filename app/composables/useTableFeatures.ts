import { ref, computed, watch, useTemplateRef } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { Table, SortingState } from '@tanstack/vue-table'

interface UseTableFeaturesOptions {
  pageSize?: number
  defaultSorting?: SortingState
}

export function useTableFeatures<T>(refName: string, options?: UseTableFeaturesOptions) {
  const tableRef = useTemplateRef<{ tableApi: Table<T> }>(refName)

  const globalFilter = ref('')
  const sorting = ref<SortingState>(options?.defaultSorting ?? [])

  const pagination = ref({
    pageIndex: 0,
    pageSize: options?.pageSize ?? 50,
  })

  // Sync filter to TanStack and reset to first page when search changes.
  // v-model:global-filter alone is insufficient because TanStack's mergeProxy
  // lazily evaluates state getters — changes aren't tracked by Vue's watchEffect.
  // We must imperatively call setGlobalFilter() to push into TanStack's internal state.
  watch(globalFilter, (value) => {
    if (tableRef.value?.tableApi) {
      tableRef.value.tableApi.setGlobalFilter(value)
      tableRef.value.tableApi.setPageIndex(0)
    }
    else {
      pagination.value.pageIndex = 0
    }
  })

  // UTable handles getSortedRowModel and getFilteredRowModel internally.
  // getPaginationRowModel must be passed explicitly for client-side pagination.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paginationOptions: any = {
    getPaginationRowModel: getPaginationRowModel(),
  }

  const currentPage = computed(() =>
    (tableRef.value?.tableApi?.getState().pagination.pageIndex ?? pagination.value.pageIndex) + 1,
  )

  const pageCount = computed(() =>
    tableRef.value?.tableApi?.getPageCount() ?? 1,
  )

  const totalRows = computed(() =>
    tableRef.value?.tableApi?.getFilteredRowModel().rows.length ?? 0,
  )

  return {
    tableRef,
    globalFilter,
    sorting,
    pagination,
    paginationOptions,
    currentPage,
    pageCount,
    totalRows,
  }
}
