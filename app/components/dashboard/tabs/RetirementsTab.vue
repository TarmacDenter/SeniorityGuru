<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'
import { RETIREMENT_PAGE_SIZE, useUpcomingRetirements } from '~/composables/seniority/modules/useUpcomingRetirements'
import type { RetirementRow, RetirementSortKey } from '~/composables/seniority/modules/useUpcomingRetirements'

// List › Upcoming retirements. Range, scope, filtering, sorting and labels come from the composable.
const {
  hasData, hasAnchor, yearsHorizon, horizonMax, horizonLabelFor, emptyResultLabel, seniorOnly,
  filterBase, filterSeat, filterFleet, baseItems, seatItems, fleetItems, sortKey, sortDir, toggleSort, rows,
  page, pageCount, pageRows,
} = useUpcomingRetirements()

// The slider and its readout move live; the report follows once the thumb rests.
const SLIDER_SETTLE_MS = 250
const sliderYears = ref(yearsHorizon.value)
const sliderLabel = computed(() => horizonLabelFor(sliderYears.value))
watch(yearsHorizon, (years) => { sliderYears.value = years })
watchDebounced(sliderYears, (years) => { yearsHorizon.value = years }, { debounce: SLIDER_SETTLE_MS })

const numeric = { class: { th: 'text-right', td: 'text-right' } }

function sortableColumn(key: RetirementSortKey, label: string, accessorKey: keyof RetirementRow): TableColumn<RetirementRow> {
  return {
    id: key,
    accessorKey,
    meta: numeric,
    header: () => h(resolveComponent('UButton'), {
      color: 'neutral',
      variant: 'ghost',
      size: 'xs',
      label,
      icon: sortKey.value === key
        ? sortDir.value === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
        : 'i-lucide-chevrons-up-down',
      'aria-label': `Sort by ${label}, currently ${sortKey.value !== key ? 'unsorted' : sortDir.value === 'asc' ? 'ascending' : 'descending'}`,
      onClick: () => toggleSort(key),
    }),
  }
}

const columns = computed<TableColumn<RetirementRow>[]>(() => [
  sortableColumn('seniorityNumber', 'Seniority Number', 'seniorityNumber'),
  { accessorKey: 'qualificationLabel', header: 'Qualification' },
  ...(hasAnchor.value ? [sortableColumn('rankRelativeToMe', 'Rank relative to me', 'relativeLabel')] : []),
  sortableColumn('retirementDate', 'Estimated retirement date', 'retirementDateLabel'),
])
</script>

<template>
  <div class="space-y-4">
    <UEmpty
      v-if="!hasData"
      icon="i-lucide-calendar-x"
      title="No seniority list loaded"
      description="Import your airline's seniority list to see upcoming retirements."
      :actions="[{ label: 'Import a list', icon: 'i-lucide-upload', to: '/seniority/upload' }]"
      class="py-16"
    />

    <template v-else>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label for="retiring-within" class="whitespace-nowrap text-sm text-muted">Retiring within</label>
        <USlider id="retiring-within" v-model="sliderYears" :min="1" :max="horizonMax" :step="1" size="sm" class="w-40 sm:w-56" aria-label="Retiring within years" />
        <span class="whitespace-nowrap font-mono text-sm font-semibold text-highlighted" aria-live="polite">{{ sliderLabel }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-3">

        <label class="flex items-center gap-2 text-sm" :class="hasAnchor ? '' : 'text-muted'">
          <AppSwitch v-model="seniorOnly" :disabled="!hasAnchor" size="sm" />
          Senior to me only
        </label>

        <div class="flex flex-wrap items-center gap-2">
          <USelectMenu v-model="filterBase" :items="baseItems" value-key="value" label-key="label" placeholder="Base" size="sm" class="w-28" aria-label="Base" />
          <USelectMenu v-model="filterSeat" :items="seatItems" value-key="value" label-key="label" placeholder="Seat" size="sm" class="w-24" aria-label="Seat" />
          <USelectMenu v-model="filterFleet" :items="fleetItems" value-key="value" label-key="label" placeholder="Fleet" size="sm" class="w-28" aria-label="Fleet" />
        </div>
      </div>

      <p v-if="!hasAnchor" class="border-l-2 border-default pl-3 text-sm text-muted">
        Set an employee number that appears in this list in
        <NuxtLink to="/settings" class="underline text-highlighted">Settings</NuxtLink>
        to see rank relative to you and filter by seniority.
      </p>

      <UTable
        :data="pageRows"
        :columns="columns"
        :get-row-id="row => row.key"
        :sorting-options="{ manualSorting: true }"
        :ui="{ td: 'font-mono', caption: 'sr-only' }"
        caption="Upcoming retirements"
      >
        <template #empty>
          <p class="font-medium text-highlighted">No retirements found</p>
          <p class="mt-1 text-sm text-muted">{{ emptyResultLabel }}</p>
        </template>
      </UTable>

      <TablePagination
        v-if="rows.length"
        :current-page="page"
        :page-count="pageCount"
        :total-rows="rows.length"
        :page-size="RETIREMENT_PAGE_SIZE"
        @update:page="(p: number) => page = p"
      />
    </template>
  </div>
</template>
