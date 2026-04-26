<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { Table, Row } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { diffYears, todayISO } from '~/utils/date'
import { useSeniorityCore, useSeniorityLists } from '~/composables/seniority'

defineProps<{
  loading?: boolean
}>()

// ── Types ────────────────────────────────────────────────────────────────────
type RetirementTimeline = 'past' | 'imminent' | 'soon' | null
type SeniorityRow = SeniorityEntry & { _isUser: boolean; _retirementTimeline: RetirementTimeline }

// ── Data ─────────────────────────────────────────────────────────────────────
const { lists, entriesLoading } = useSeniorityLists()
const { entries } = useSeniorityCore()
const { employeeNumber } = useUser()
const userEmployeeNumber = computed(() => employeeNumber.value ?? null)
const latestList = computed(() => lists.value[0] ?? null)

// ── Retirement timeline ───────────────────────────────────────────────────────
const timelineClasses = new Map<RetirementTimeline, { row: string, cell: string, expanded: string }>([
  ['past',     { row: 'bg-past/10',     cell: 'text-past/50',     expanded: 'text-past/70'     }],
  ['imminent', { row: 'bg-imminent/10', cell: 'text-imminent/50', expanded: 'text-imminent/70' }],
  ['soon',     { row: 'bg-soon/10',     cell: 'text-soon',        expanded: 'text-soon'        }],
])

function retirementTimeline(today: string, retireDate: string): RetirementTimeline {
  const days = diffYears(today, retireDate) * 365.25
  if (days < 0) return 'past'
  if (days <= 180) return 'imminent'
  if (days <= 365) return 'soon'
  return null
}

// ── Table config ──────────────────────────────────────────────────────────────
const isMobile = useMediaQuery('(max-width: 639px)')

const columnVisibility = computed(() => ({
  expand: isMobile.value,
  name: true,
  employee_number: true,
  seat: !isMobile.value,
  base: !isMobile.value,
  hire_date: !isMobile.value,
  fleet: !isMobile.value,
  retire_date: !isMobile.value,
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
  {
    accessorKey: 'retire_date',
    header: 'Retire Date',
    cell: ({ row }) => h('span', { class: timelineClasses.get(row.original._retirementTimeline)?.cell }, row.original.retire_date ?? ''),
  },
]

const tableMeta = {
  class: {
    tr: (row: Row<SeniorityRow>) => [
      row.original._isUser ? 'bg-primary/10' : '',
      timelineClasses.get(row.original._retirementTimeline)?.row ?? '',
    ].join(' ').trim(),
  },
}

// ── Table state ───────────────────────────────────────────────────────────────
const table = useTemplateRef<{ tableApi: Table<SeniorityRow> }>('table')
const globalFilter = ref('')
const expanded = ref({})
const pagination = ref({ pageIndex: 0, pageSize: 50 })

const mobileFilteredData = computed(() => {
  const term = globalFilter.value.trim().toLowerCase()
  if (!term) return tableData.value

  return tableData.value.filter(row => [
    row.name,
    row.employee_number,
    String(row.seniority_number),
    row.base,
    row.fleet,
    row.seat,
  ].some(value => (value ?? '').toString().toLowerCase().includes(term)))
})

const mobilePageRows = computed(() => {
  if (!isMobile.value) return []
  const start = pagination.value.pageIndex * pagination.value.pageSize
  return mobileFilteredData.value.slice(start, start + pagination.value.pageSize)
})

const currentPage = computed(() => {
  if (isMobile.value) return pagination.value.pageIndex + 1
  return (table.value?.tableApi?.getState().pagination.pageIndex ?? 0) + 1
})

const pageCount = computed(() => {
  if (isMobile.value) return Math.max(1, Math.ceil(mobileFilteredData.value.length / pagination.value.pageSize))
  return table.value?.tableApi?.getPageCount() ?? 1
})

const totalRows = computed(() => {
  if (isMobile.value) return mobileFilteredData.value.length
  return table.value?.tableApi?.getFilteredRowModel().rows.length ?? 0
})

// Imperatively sync filter to TanStack — v-model:global-filter alone doesn't
// trigger recomputation because TanStack's mergeProxy lazily evaluates state getters.
watch(globalFilter, (value) => {
  pagination.value.pageIndex = 0
  if (table.value?.tableApi) {
    table.value.tableApi.setGlobalFilter(value)
    table.value.tableApi.setPageIndex(0)
  }
})

// ── Derived data ──────────────────────────────────────────────────────────────
const tableData = computed<SeniorityRow[]>(() => {
  const today = todayISO()
  return entries.value.map(entry => ({
    ...entry,
    _isUser: !!userEmployeeNumber.value && entry.employee_number === userEmployeeNumber.value,
    _retirementTimeline: entry.retire_date ? retirementTimeline(today, entry.retire_date) : null,
  }))
})

const mobileTimelineTone = computed<Record<Exclude<RetirementTimeline, null>, 'error' | 'warning' | 'secondary'>>(() => ({
  past: 'secondary',
  imminent: 'error',
  soon: 'warning',
}))

function updatePage(page: number) {
  const pageIndex = Math.max(0, page - 1)
  pagination.value.pageIndex = pageIndex
  table.value?.tableApi?.setPageIndex(pageIndex)
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0 min-w-0 px-1">
    <!-- Search — pinned at top, never scrolls away -->
    <div class="shrink-0 border-b border-default">
      <AppSearchInput v-model="globalFilter" placeholder="Search by name, employee #, base..."
        class="w-full text-xs sm:text-sm my-1 md:mb-3" />
    </div>

    <!-- Scrollable content area -->
    <div class="flex-1 overflow-scroll min-h-0 overscroll-auto md:overscroll-contain">
      <div class="sm:p-6">
        <!-- Empty state -->
        <UEmpty v-if="!loading && !latestList" icon="i-lucide-list-ordered" title="No Seniority List Yet"
          description="Upload your airline's seniority list to view your position, track retirements, and project your trajectory."
          :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
          class="py-24" />

        <!-- List viewer -->
        <template v-else>

          <div v-if="isMobile" class="space-y-3 px-2 py-3">
            <UCard
              v-for="row in mobilePageRows"
              :key="`${row.employee_number}-${row.seniority_number}`"
              :ui="{ body: 'p-3' }"
              :class="row._isUser ? 'ring-1 ring-primary/60' : ''"
            >
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold leading-tight">{{ row.name || 'Unknown name' }}</p>
                    <p class="text-xs text-muted">Emp # {{ row.employee_number || '—' }}</p>
                  </div>
                  <UBadge color="neutral" variant="subtle">#{{ row.seniority_number }}</UBadge>
                </div>

                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <p class="text-muted">Seat</p>
                    <p>{{ row.seat || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-muted">Base</p>
                    <p>{{ row.base || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-muted">Fleet</p>
                    <p>{{ row.fleet || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-muted">Hire Date</p>
                    <p>{{ row.hire_date || '—' }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <p class="text-xs text-muted">Retire Date</p>
                  <UBadge
                    v-if="row.retire_date"
                    :color="row._retirementTimeline ? mobileTimelineTone[row._retirementTimeline] : 'neutral'"
                    variant="soft"
                  >
                    {{ row.retire_date }}
                  </UBadge>
                  <span v-else class="text-xs">—</span>
                </div>
              </div>
            </UCard>
          </div>

          <div v-else class="overflow-x-auto">
            <UTable ref="table" v-model:global-filter="globalFilter" v-model:pagination="pagination"
              v-model:expanded="expanded" v-model:column-visibility="columnVisibility" :data="tableData"
              :columns="columns" :loading="loading || entriesLoading"
              :expanded-options="{ getRowCanExpand: () => true }"
              :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }" sticky :meta="tableMeta"
              :ui="isMobile ? { th: 'px-2 py-2 text-xs', td: 'px-2 py-1.5 text-xs' } : {}"
              class="w-full overscroll-contain text-xs sm:text-base">
              <template #expanded="{ row }">
                <div
                  :class="['grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 py-3 text-xs', row.original._isUser ? 'bg-primary/5' : '']">
                  <div class="sm:hidden">
                    <p class="text-muted text-xs mb-0.5">Seat</p>
                    <p>{{ row.original.seat }}</p>
                  </div>
                  <div class="sm:hidden">
                    <p class="text-muted text-xs mb-0.5">Base</p>
                    <p>{{ row.original.base }}</p>
                  </div>
                  <div class="sm:hidden">
                    <p class="text-muted text-xs mb-0.5">Fleet</p>
                    <p>{{ row.original.fleet }}</p>
                  </div>
                  <div>
                    <p class="text-muted text-xs mb-0.5">Hire Date</p>
                    <p>{{ row.original.hire_date }}</p>
                  </div>
                  <div class="sm:hidden">
                    <p class="text-muted text-xs mb-0.5">Retire Date</p>
                    <p :class="timelineClasses.get(row.original._retirementTimeline)?.expanded">{{ row.original.retire_date ?? '—' }}</p>
                  </div>
                </div>
              </template>
            </UTable>
          </div>
        </template>
      </div>
    </div>

    <!-- Pagination — floats below scroll area, always visible -->
    <div v-if="latestList" class="shrink-0 py-2 sm:py-3 border-t border-default">
      <TablePagination :current-page="currentPage" :page-count="pageCount" :total-rows="totalRows"
        :page-size="pagination.pageSize" @update:page="updatePage" />
    </div>
  </div>
</template>
