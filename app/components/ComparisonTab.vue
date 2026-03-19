<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/utils/column-definitions'

const props = defineProps<{
  data: unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: TableColumn<any>[]
  searchPlaceholder?: string
  filters?: FilterConfig[]
}>()

const table = useTableFeatures('comparisonTable')

// Reactive state: selected values per filter key
const activeFilters = reactive<Record<string, string[]>>({})

// Compute unique option values for each filter key from unfiltered data
const filterOptions = computed<Record<string, string[]>>(() => {
  if (!props.filters?.length) return {}
  const options: Record<string, string[]> = {}
  for (const filter of props.filters) {
    const values = new Set<string>()
    for (const row of props.data) {
      const val = (row as Record<string, unknown>)[filter.key]
      if (val != null && val !== '') {
        values.add(String(val))
      }
    }
    options[filter.key] = [...values].sort()
  }
  return options
})

// Compute filtered data: AND between fields, OR within a field
const filteredData = computed(() => {
  if (!props.filters?.length) return props.data

  return props.data.filter((row) => {
    for (const filter of props.filters!) {
      const selected = activeFilters[filter.key]
      if (!selected || selected.length === 0) continue
      const val = (row as Record<string, unknown>)[filter.key]
      const strVal = val != null ? String(val) : ''
      if (!selected.includes(strVal)) return false
    }
    return true
  })
})

defineExpose({ filterOptions, filteredData, activeFilters })
</script>

<template>
  <div class="space-y-3 pt-3">
    <div v-if="filters?.length" data-testid="filter-bar" class="flex flex-wrap gap-3">
      <UFormField v-for="filter in filters" :key="filter.key" :label="filter.label">
        <USelectMenu
          v-model="activeFilters[filter.key]"
          :items="filterOptions[filter.key] ?? []"
          multiple
          :placeholder="`All ${filter.label}s`"
          class="w-40"
        />
      </UFormField>
    </div>
    <UInput
      v-model="table.globalFilter.value"
      icon="i-lucide-search"
      :placeholder="searchPlaceholder"
      class="max-w-sm"
    />
    <div class="overflow-x-auto">
      <UTable
        ref="comparisonTable"
        v-model:global-filter="table.globalFilter.value"
        v-model:pagination="table.pagination.value"
        v-model:sorting="table.sorting.value"
        :data="filteredData"
        :columns="columns"
        :pagination-options="table.paginationOptions"
      />
    </div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted">{{ table.totalRows.value }} results</p>
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
