<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { HoldabilityDetailView, HoldabilityRow, HoldabilitySeatGroup } from '~/composables/seniority'

// Every Qualification of the chosen seat with today's Rank and its Holdable Year. Shared by Current › Holdability
// (selectable rows open a chart) and the landing page (read-only rows).
const props = defineProps<{
  groups: HoldabilitySeatGroup[]
  /** Why no Rank exists (e.g. "Anchor Pilot retired"); replaces the Qualifications when set. */
  noResultLabel: string | null
  columnLabels: { qualification: string, rank: string, rosterSize: string, percentile: string, status: string }
  seatOptions: { label: string, value: string }[]
  selectedSeat: string | null
  /** Rows open the chosen Qualification's chart; off, the rows are read-only. */
  selectable?: boolean
  selectedKey?: string | null
  detail?: HoldabilityDetailView | null
  juniorCaptainsLink?: string
}>()

const emit = defineEmits<{ 'select': [key: string], 'update:selectedSeat': [seat: string] }>()

const seat = computed({
  get: () => props.selectedSeat ?? '',
  set: (value: string) => emit('update:selectedSeat', value),
})

const columns = computed<TableColumn<HoldabilityRow>[]>(() => [
  { id: 'qualification', header: props.columnLabels.qualification },
  { id: 'status', header: props.columnLabels.status, meta: { class: { th: 'hidden sm:table-cell', td: 'hidden sm:table-cell' } } },
  { accessorKey: 'rankLabel', header: props.columnLabels.rank, meta: { class: { th: 'text-right', td: 'text-right font-mono' } } },
  { accessorKey: 'rosterOfLabel', header: props.columnLabels.rosterSize, meta: { class: { th: 'text-right hidden sm:table-cell', td: 'text-right font-mono hidden sm:table-cell' } } },
  { accessorKey: 'percentileLabel', header: props.columnLabels.percentile, meta: { class: { th: 'text-right', td: 'text-right font-mono' } } },
])

const expanded = computed(() => (props.selectedKey ? { [props.selectedKey]: true } : {}))
const rowId = (row: HoldabilityRow) => row.key
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-1.5">
        <h2 class="font-semibold text-highlighted">When can you hold each Qualification?</h2>
        <UPopover>
          <UButton icon="i-lucide-info" color="neutral" variant="ghost" size="xs" aria-label="About Holdable" />
          <template #content>
            <div class="max-w-xs space-y-2 p-3 text-sm text-muted">
              <p>Holdable is a modeled outcome, not a vacancy or an award.</p>
              <p>A Qualification is Holdable from the first year your projected company Seniority Percentile meets its Qualification Threshold as of today. Future occupancy, vacancies, bids, transfers and awards are not modeled.</p>
              <p>Rank today already leaves out pilots who have retired since the list was published.</p>
              <NuxtLink to="/how-it-works#holdability" class="text-highlighted underline">Learn more about Holdable and Qualification Thresholds</NuxtLink>
            </div>
          </template>
        </UPopover>
      </div>
      <p v-if="selectable" class="mt-1 text-sm text-muted">Choose a Qualification to see how the gap closes.</p>
    </template>

    <p v-if="noResultLabel" data-testid="no-result" class="font-mono font-semibold text-highlighted">{{ noResultLabel }}</p>

    <div v-else class="space-y-3">
      <AppButtonToggle v-if="seatOptions.length > 1" v-model="seat" :options="seatOptions" aria-label="Seat" />
      <section v-for="group in groups" :key="group.seat" :aria-label="group.seatLabel">
        <UBadge v-if="group.hypotheticalLabel" color="neutral" variant="outline" size="sm" class="mb-2">{{ group.hypotheticalLabel }}</UBadge>
        <SeniorityAnchoredTable
          :data="group.rows"
          :columns="columns"
          mark-column="qualification"
          :get-row-id="rowId"
          :expanded="expanded"
          :ui="{ td: 'py-2 align-top', th: 'py-2' }"
        >
          <template #qualification-cell="{ row }">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <button
                v-if="selectable"
                type="button"
                class="flex items-center gap-1 text-left font-medium underline-offset-2 hover:underline"
                :aria-expanded="selectedKey === row.original.key"
                @click="emit('select', row.original.key)"
              >
                <UIcon :name="selectedKey === row.original.key ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="size-4 shrink-0" aria-hidden="true" />
                {{ row.original.baseFleetLabel }}
              </button>
              <span v-else class="font-medium">{{ row.original.baseFleetLabel }}</span>
            </div>
            <div class="mt-1 whitespace-normal sm:hidden">
              <span :class="row.original.holdableStatus === 'now' ? 'font-semibold' : ''">{{ row.original.holdableLabel }}</span>
              <p v-if="row.original.thresholdRelationLabel" class="text-xs text-muted">{{ row.original.thresholdRelationLabel }}</p>
            </div>
          </template>
          <template #status-cell="{ row }">
            <div class="whitespace-normal">
              <span :class="row.original.holdableStatus === 'now' ? 'font-semibold' : ''">{{ row.original.holdableLabel }}</span>
              <p v-if="row.original.thresholdRelationLabel" class="text-xs text-muted">{{ row.original.thresholdRelationLabel }}</p>
            </div>
          </template>
          <template #expanded="{ row }">
            <div v-if="selectable && detail && row.original.key === selectedKey" class="space-y-3 whitespace-normal py-2">
              <p class="text-sm">
                <span class="font-semibold text-highlighted">{{ detail.holdableLabel }}</span>
                <span class="text-muted"> · {{ detail.qualificationLabel }} · Qualification Threshold today {{ detail.thresholdPercentileLabel }}</span>
              </p>
              <DashboardHoldabilityChart :detail="detail" />
              <NuxtLink v-if="juniorCaptainsLink" :to="juniorCaptainsLink" class="inline-flex items-center gap-1 text-sm text-highlighted underline">
                Junior captains in Demographics
                <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
              </NuxtLink>
            </div>
          </template>
        </SeniorityAnchoredTable>
      </section>
    </div>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
