<template>
  <div class="min-w-0">
    <!-- Search -->
    <div class="px-4 sm:px-6 py-3 border-b border-default">
      <UInput v-model="globalFilter" :fixed=true icon="i-lucide-search"
        placeholder="Search by name, employee #, base..."
        class="w-full text-xs sm:text-sm">
        <template v-if="globalFilter" #trailing>
          <UButton icon="i-lucide-x" variant="link" color="neutral" size="xs"
            aria-label="Clear search" @click="globalFilter = ''" />
        </template>
      </UInput>
    </div>

    <div class="p-4 sm:p-6">
      <!-- Empty state -->
      <UEmpty v-if="!loading && !latestList" icon="i-lucide-list-ordered" title="No Seniority List Yet"
        description="Upload your airline's seniority list to view your position, track retirements, and project your trajectory."
        :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
        class="py-24" />

      <!-- List viewer -->
      <template v-else>
        <!-- Metadata -->
        <p v-if="latestList" class="text-sm text-muted mb-4">
          {{ latestList.airline }} &middot; Effective {{ latestList.effective_date }}
          &middot; {{ seniorityStore.entries.length }} pilots
        </p>

        <UTable ref="table" :data="tableData" :columns="columns" :loading="loading || seniorityStore.entriesLoading"
          v-model:global-filter="globalFilter" v-model:pagination="pagination" v-model:expanded="expanded"
          v-model:column-visibility="columnVisibility" :expanded-options="{ getRowCanExpand: () => true }"
          :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }" sticky
          class="seniority-table w-full touch-pan-y overscroll-contain">
          <template #expanded="{ row }">
            <div :class="['grid grid-cols-3 gap-3 px-4 py-3 text-sm', row.original._isUser ? 'bg-primary/5' : '']">
              <div>
                <p class="text-muted text-xs mb-0.5">Name</p>
                <p :class="row.original._isUser ? 'font-bold text-primary' : 'font-medium'">{{ row.original.name }}
                </p>
              </div>
              <div>
                <p class="text-muted text-xs mb-0.5">Emp #</p>
                <p>{{ row.original.employee_number }}</p>
              </div>
              <div>
                <p class="text-muted text-xs mb-0.5">Hire Date</p>
                <p>{{ row.original.hire_date }}</p>
              </div>
            </div>
          </template>
        </UTable>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-4">
          <p class="hidden md:block text-sm text-muted">
            Page {{ currentPage }} of {{ pageCount }}
          </p>
          <UPagination :page="currentPage" :total="totalRows"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :sibling-count="isMobile ? 0 : 2" :size="isMobile ? 'xs' : 'sm'" show-edges
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { getPaginationRowModel } from '@tanstack/vue-table';
import type { Table } from '@tanstack/vue-table';
import type { TableColumn } from '@nuxt/ui';
import type { Tables } from '#shared/types/database';
import { useSeniorityStore } from '~/stores/seniority';
import { useUserStore } from '~/stores/user';

defineProps<{
  loading?: boolean;
}>();

type SeniorityEntry = Tables<'seniority_entries'>;
type SeniorityRow = SeniorityEntry & { _isUser: boolean; };

const seniorityStore = useSeniorityStore();
const userStore = useUserStore();
const table = useTemplateRef<{ tableApi: Table<SeniorityRow>; }>('table');

const globalFilter = ref('');
const expanded = ref({});
const isMobile = useMediaQuery('(max-width: 639px)');

const pagination = ref({
  pageIndex: 0,
  pageSize: 50,
});

const columnVisibility = computed(() => ({
  expand: isMobile.value,
  name: !isMobile.value,
  employee_number: !isMobile.value,
  hire_date: !isMobile.value,
}));

const columns: TableColumn<SeniorityRow>[] = [
  {
    id: 'expand',
    header: '',
    cell: ({ row }) => h(resolveComponent('UButton'), {
      icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
      variant: 'ghost',
      color: 'neutral',
      size: 'xs',
      'aria-label': 'Expand row',
      onClick: row.getToggleExpandedHandler(),
    }),
  },
  { accessorKey: 'seniority_number', header: 'Sen #', cell: ({ row }) => h('span', { class: 'font-mono' }, String(row.original.seniority_number)) },
  { accessorKey: 'employee_number', header: 'Emp #', cell: ({ row }) => h('span', { class: row.original._isUser ? 'font-bold text-primary' : '' }, row.original.employee_number ?? '') },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'fleet', header: 'Fleet' },
  { accessorKey: 'hire_date', header: 'Hire Date' },
  { accessorKey: 'retire_date', header: 'Retire Date' },
];

const latestList = computed(() => seniorityStore.lists[0] ?? null);

const currentPage = computed(() => (table.value?.tableApi?.getState().pagination.pageIndex ?? 0) + 1);
const pageCount = computed(() => table.value?.tableApi?.getPageCount() ?? 1);
const totalRows = computed(() => table.value?.tableApi?.getFilteredRowModel().rows.length ?? 0);

const userEmployeeNumber = computed(() => userStore.profile?.employee_number ?? null);

const tableData = computed<SeniorityRow[]>(() =>
  seniorityStore.entries.map(entry => ({
    ...entry,
    _isUser: !!userEmployeeNumber.value && entry.employee_number === userEmployeeNumber.value,
  }))
);
</script>

<style scoped>
.seniority-table :deep(tr:has(td span.text-primary)) {
  background-color: color-mix(in srgb, var(--ui-primary) 10%, transparent);
}
</style>
