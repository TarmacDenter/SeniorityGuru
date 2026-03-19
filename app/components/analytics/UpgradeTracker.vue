<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { UpgradeTrackerResponse } from '~/composables/useQualUpgrades'

type IntervalRow = {
  dateRange: string
  upgrades: number
  fleetChanges: number
  downgrades: number
}

const props = defineProps<{
  data: UpgradeTrackerResponse | null
  loading: boolean
  error: string | null
}>()

const tableRows = computed<IntervalRow[]>(() =>
  (props.data?.intervals ?? []).map(i => ({
    dateRange: `${i.fromDate} → ${i.toDate}`,
    upgrades: i.upgrades,
    fleetChanges: i.fleetChanges,
    downgrades: i.downgrades,
  })),
)

const columns: TableColumn<IntervalRow>[] = [
  { accessorKey: 'dateRange', header: 'Date Range' },
  { accessorKey: 'upgrades', header: 'Upgrades', cell: ({ row }) => h('span', { class: 'font-mono' }, row.original.upgrades) },
  { accessorKey: 'fleetChanges', header: 'Fleet Changes', cell: ({ row }) => h('span', { class: 'font-mono' }, row.original.fleetChanges) },
  { accessorKey: 'downgrades', header: 'Downgrades', cell: ({ row }) => h('span', { class: 'font-mono' }, row.original.downgrades) },
]
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-3 gap-4">
        <USkeleton v-for="i in 3" :key="i" class="h-20" />
      </div>
      <USkeleton class="h-48" />
    </div>

    <!-- Error state -->
    <UAlert
      v-else-if="error"
      icon="i-lucide-alert-circle"
      color="error"
      variant="subtle"
      title="Failed to Load Upgrade Data"
      :description="error"
    />

    <!-- Not enough data -->
    <UAlert
      v-else-if="!data?.hasEnoughData"
      icon="i-lucide-info"
      color="neutral"
      variant="subtle"
      title="Not Enough Data"
      description="Upload seniority lists from different dates to begin tracking qual movement."
    />

    <!-- Data available -->
    <template v-else-if="data">
      <!-- Summary totals -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4 text-center">
          <div class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
            {{ data.totals.upgrades }}
          </div>
          <div class="text-sm text-[var(--ui-text-muted)] mt-1">
            Upgrades (FO → CA)
          </div>
        </div>
        <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4 text-center">
          <div class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
            {{ data.totals.fleetChanges }}
          </div>
          <div class="text-sm text-[var(--ui-text-muted)] mt-1">
            Fleet Changes
          </div>
        </div>
        <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4 text-center">
          <div class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
            {{ data.totals.downgrades }}
          </div>
          <div class="text-sm text-[var(--ui-text-muted)] mt-1">
            Downgrades (CA → FO)
          </div>
        </div>
      </div>

      <!-- Intervals table -->
      <UTable :data="tableRows" :columns="columns" />
    </template>
  </div>
</template>
