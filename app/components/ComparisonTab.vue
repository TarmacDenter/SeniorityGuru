<template>
  <div class="space-y-3 pt-3">
    <UInput
      v-model="table.globalFilter.value"
      icon="i-lucide-search"
      :placeholder="searchPlaceholder"
      class="max-w-sm"
    />
    <UTable
      ref="comparisonTable"
      :data="data"
      :columns="columns"
      v-model:global-filter="table.globalFilter.value"
      v-model:pagination="table.pagination.value"
      v-model:sorting="table.sorting.value"
      :pagination-options="table.paginationOptions"
    />
    <div class="flex items-center justify-between">
      <p class="text-sm text-(--ui-text-muted)">{{ table.totalRows.value }} results</p>
      <UPagination
        v-if="table.pageCount.value > 1"
        :page="table.currentPage.value"
        :total="table.totalRows.value"
        :items-per-page="table.pagination.value.pageSize"
        @update:page="(p: number) => table.tableRef.value?.tableApi?.setPageIndex(p - 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

defineProps<{
  data: any[]
  columns: TableColumn<any>[]
  searchPlaceholder?: string
}>()

const table = useTableFeatures('comparisonTable')
</script>
