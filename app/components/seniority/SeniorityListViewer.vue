<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { Row, Table } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import type { QualificationScope, QualificationViewerEntry } from '~/utils/seniority'
import { analyzeSeniorityQualificationViewer } from '~/utils/seniority'
import { diffYears } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'
import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'
import { useSeniorityCore, useSeniorityLists } from '~/composables/seniority'

const props = defineProps<{ loading?: boolean }>()

type RetirementTimeline = 'past' | 'imminent' | 'soon' | null
type SeniorityRow = QualificationViewerEntry & { _retirementTimeline: RetirementTimeline }
const COMPANY_WIDE_VALUE = '__company_wide__'

function retirementTimeline(today: string, retireDate: string): RetirementTimeline {
  const days = diffYears(today, retireDate) * 365.25
  if (days < 0) return 'past'
  if (days <= 180) return 'imminent'
  if (days <= 365) return 'soon'
  return null
}

const { lists, entriesLoading } = useSeniorityLists()
const { entries, isNewHireMode } = useSeniorityCore()
const { employeeNumber } = useUser()
const table = useTemplateRef<{ tableApi: Table<SeniorityRow> }>('table')
const isMobile = useMediaQuery('(max-width: 639px)')
const globalFilter = ref('')
const expanded = ref({})
const selectedQualKey = ref('')
const insertSelf = ref(false)
const isLoading = computed(() => !!props.loading || entriesLoading.value)

const qualOptions = computed(() => {
  const seen = new Set<string>()
  const options = entries.value
    .toSorted((a, b) => a.seniority_number - b.seniority_number)
    .filter((entry) => {
      const key = `${entry.base}|${entry.fleet}|${entry.seat}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(entry => ({
      label: `${entry.base}-${entry.fleet}-${entry.seat}`,
      value: JSON.stringify([entry.base, entry.seat, entry.fleet]),
      qualificationScope: { base: entry.base, fleet: entry.fleet, seat: entry.seat },
    }))
  return [{ label: 'Company-wide', value: COMPANY_WIDE_VALUE, qualificationScope: {} }, ...options]
})

const qualificationScope = computed<QualificationScope>(() => {
  if (!selectedQualKey.value || selectedQualKey.value === COMPANY_WIDE_VALUE) return {}
  return qualOptions.value.find(option => option.value === selectedQualKey.value)?.qualificationScope ?? {}
})
const isQualMode = computed(() => Object.keys(qualificationScope.value).length === 3)
const anchorFound = computed(() => {
  if (!employeeNumber.value) return false
  const normalized = normalizeEmployeeNumber(employeeNumber.value)
  return entries.value.some(e => normalizeEmployeeNumber(e.employee_number) === normalized)
})
const canInsert = computed(() => anchorFound.value && !isNewHireMode.value)
const insertDisabledReason = computed(() => {
  if (isNewHireMode.value) return 'Insert yourself is unavailable in New Hire Mode.'
  if (!employeeNumber.value) return 'Enter your employee number to enable Insert yourself.'
  if (!anchorFound.value) return 'Your employee number is not present in this selected list.'
  return ''
})

watch(entries, () => {
  if (selectedQualKey.value && !qualOptions.value.some(option => option.value === selectedQualKey.value)) selectedQualKey.value = ''
  pagination.value.pageIndex = 0
})
watch(isNewHireMode, (enabled) => {
  if (enabled) insertSelf.value = false
})

watch(globalFilter, (value) => {
  table.value?.tableApi?.setGlobalFilter(value)
  pagination.value.pageIndex = 0
})

const projected = computed(() => analyzeSeniorityQualificationViewer({
  entries: entries.value,
  qualificationScope: qualificationScope.value,
  employeeNumber: employeeNumber.value,
  insertSelf: insertSelf.value && canInsert.value,
  asOfDate: todayPlainDate(),
}))

const tableData = computed<SeniorityRow[]>(() => projected.value.entries.map(row => ({
  ...row,
  _retirementTimeline: retirementTimeline(todayPlainDate().toString(), row.retirementDate?.toString() ?? todayPlainDate().toString()),
})))

const columnVisibility = computed(() => ({
  expand: isMobile.value,
  qualificationRank: true,
  qualificationPercentile: true,
  companyRank: true,
  name: true,
  employeeNumber: !isMobile.value,
  companyPercentile: !isMobile.value,
  seat: !isMobile.value,
  base: !isMobile.value,
  fleet: !isMobile.value,
  hireDate: !isMobile.value,
  retirementDate: !isMobile.value,
  status: !isMobile.value,
}))

const columns: TableColumn<SeniorityRow>[] = [
  {
    id: 'expand', header: '', cell: ({ row }) => h(resolveComponent('UButton'), {
      icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right', variant: 'ghost', color: 'neutral', size: 'xs',
      'aria-label': 'Expand row', onClick: row.getToggleExpandedHandler(),
    }),
  },
  { accessorKey: 'qualificationRank', header: 'Qualification Rank', cell: ({ row }) => h('span', { class: 'font-mono font-semibold' }, row.original.qualificationRank ?? '—') },
  { accessorKey: 'qualificationPercentile', header: 'Qualification percentile', cell: ({ row }) => row.original.qualificationPercentile === null ? '—' : `${row.original.qualificationPercentile}%` },
  { accessorKey: 'companyRank', header: 'Company Rank', cell: ({ row }) => h('span', { class: 'font-mono' }, row.original.companyRank ?? row.original.listRank) },
  { accessorKey: 'companyPercentile', header: 'Company %', cell: ({ row }) => {
    const percentile = row.original.companyPercentile ?? (row.original.status === 'retired' ? row.original.listPercentile : null)
    return percentile === null ? '—' : `${percentile}%`
  } },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'employeeNumber', header: 'Emp #' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'fleet', header: 'Fleet' },
  { accessorKey: 'hireDate', header: 'Hire Date' },
  { accessorKey: 'retirementDate', header: 'Retire Date' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => row.original.status === 'active' ? '' : row.original.status },
]

const tableMeta = {
  class: {
    tr: (row: Row<SeniorityRow>) => [
      row.original.isAnchor ? 'bg-primary/10' : '',
      row.original.isMarker ? 'ring-1 ring-inset ring-primary' : '',
      row.original.status === 'retired' ? 'bg-past/10 text-muted' : '',
      row.original._retirementTimeline === 'imminent' ? 'bg-imminent/10' : '',
      row.original._retirementTimeline === 'soon' ? 'bg-soon/10' : '',
    ].join(' ').trim(),
  },
}

const latestList = computed(() => lists.value[0] ?? null)
const currentPage = computed(() => (table.value?.tableApi?.getState().pagination.pageIndex ?? 0) + 1)
const pageCount = computed(() => table.value?.tableApi?.getPageCount() ?? 1)
const totalEntryCount = computed(() => table.value?.tableApi?.getFilteredRowModel().rows.length ?? tableData.value.length)
const pagination = ref({ pageIndex: 0, pageSize: 50 })

function focusUserPage() {
  const targetIndex = projected.value.entries.findIndex(row => row.isAnchor)
  if (targetIndex >= 0) {
    pagination.value.pageIndex = Math.floor(targetIndex / pagination.value.pageSize)
  }
}

watch(selectedQualKey, (value, previousValue) => {
  if (value === previousValue) return
  pagination.value.pageIndex = 0
  nextTick(focusUserPage)
})

function toggleInsert() {
  if (!canInsert.value) return
  insertSelf.value = !insertSelf.value
  nextTick(() => {
    focusUserPage()
    nextTick(() => scrollToUserRow())
  })
}

function scrollToUserRow() {
  const tableElement = (table.value as unknown as { $el?: HTMLElement } | undefined)?.$el
  if (!tableElement || !employeeNumber.value) return
  const target = [...tableElement.querySelectorAll('tbody tr')].find(row =>
    row.textContent?.includes(employeeNumber.value!),
  )
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0 min-w-0">
    <div class="shrink-0 border-b border-default space-y-2 p-2 sm:p-3">
      <div class="flex flex-wrap items-center gap-2">
        <USelect v-model="selectedQualKey" :items="qualOptions" value-key="value" label-key="label" class="min-w-44" placeholder="Company-wide" />
        <UButton :variant="insertSelf ? 'solid' : 'outline'" :disabled="!canInsert" icon="i-lucide-user-plus" size="sm" @click="toggleInsert">Insert yourself</UButton>
        <span v-if="!canInsert" class="text-xs text-muted">{{ insertDisabledReason }}</span>
      </div>
      <UInput v-model="globalFilter" icon="i-lucide-search" placeholder="Search by name or employee number..." class="w-full text-xs sm:text-sm">
        <template v-if="globalFilter" #trailing><UButton icon="i-lucide-x" variant="link" color="neutral" size="xs" aria-label="Clear search" @click="globalFilter = ''" /></template>
      </UInput>
    </div>

    <div class="flex-1 min-h-0 overflow-hidden">
      <div class="h-full min-h-0 sm:p-6 flex flex-col">
        <UEmpty v-if="!latestList && !isLoading" icon="i-lucide-list-ordered" title="No Seniority List Yet" description="Upload your airline's seniority list to view your position." :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]" class="py-24" />
        <template v-else>
          <p v-if="latestList" class="shrink-0 text-sm text-muted mb-4">{{ isQualMode ? `${qualificationScope.base}-${qualificationScope.fleet}-${qualificationScope.seat}` : 'Company-wide' }} · {{ projected.totalEntryCount }} pilots</p>
          <div class="flex-1 min-h-0 overflow-auto overscroll-contain">
            <UTable ref="table" v-model:global-filter="globalFilter" v-model:pagination="pagination" v-model:expanded="expanded" v-model:column-visibility="columnVisibility" :data="tableData" :columns="columns" :loading="isLoading" :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }" sticky :meta="tableMeta" :expanded-options="{ getRowCanExpand: () => true }" :ui="isMobile ? { th: 'px-2 py-2 text-xs', td: 'px-2 py-1.5 text-xs' } : {}" class="w-full text-xs sm:text-base">
              <template #expanded="{ row }">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3 text-xs">
                  <div><p class="text-muted mb-0.5">Qualification Rank</p><p>{{ row.original.qualificationRank ?? '—' }}</p></div>
                  <div><p class="text-muted mb-0.5">Qualification percentile</p><p>{{ row.original.qualificationPercentile === null ? '—' : `${row.original.qualificationPercentile}%` }}</p></div>
                  <div><p class="text-muted mb-0.5">Company Rank</p><p>{{ row.original.companyRank ?? (row.original.status === 'retired' ? row.original.listRank : '—') }}</p></div>
                  <div><p class="text-muted mb-0.5">Company percentile</p><p>{{ row.original.companyPercentile ?? (row.original.status === 'retired' ? row.original.listPercentile : '—') }}<span v-if="row.original.companyPercentile !== null || row.original.status === 'retired'">%</span></p></div>
                  <div><p class="text-muted mb-0.5">Employee number</p><p>{{ row.original.employeeNumber }}</p></div>
                  <div><p class="text-muted mb-0.5">Retirement</p><p>{{ row.original.retirementDate }} <span v-if="row.original.status !== 'active'">· {{ row.original.status }}</span></p></div>
                </div>
              </template>
            </UTable>
          </div>
        </template>
      </div>
    </div>

    <div v-if="latestList" class="shrink-0 py-2 sm:py-3 border-t border-default">
      <TablePagination :current-page="currentPage" :page-count="pageCount" :total-rows="totalEntryCount" :page-size="pagination.pageSize" @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)" />
    </div>
  </div>
</template>
