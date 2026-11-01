<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { useMediaQuery } from '@vueuse/core';

type BaseStatusRow = {
  base: string;
  seat: string;
  fleet: string;
  rank: number;
  publicationPosition: number;
  rosterSize: number;
  activePilotCount: number;
  seniorityPercentile: number;
  isAnchorCurrentQualification: boolean;
  /** Set for qualifications you are not in; Rank and Roster Size count you as a modeled pilot there. */
  hypotheticalLabel?: string | null;
};

const props = defineProps<{
  data: BaseStatusRow[];
  /** Why no Rank exists (e.g. "Anchor Pilot retired"); replaces the table when set. */
  noResultLabel?: string | null;
}>();

const isMobile = useMediaQuery('(max-width: 639px)');

// Mobile seat filter — default to first available seat
const availableSeats = computed(() => [...new Set(props.data.map(r => r.seat))].sort());
const mobileSeat = ref<string | undefined>(undefined);

// Auto-select first seat when data loads
watch(availableSeats, (seats) => {
  if (seats.length && !mobileSeat.value) mobileSeat.value = seats[0];
}, { immediate: true });

const displayData = computed<BaseStatusRow[]>(() => {
  const base = props.data;
  // On mobile, filter by selected seat to reduce rows
  if (isMobile.value && mobileSeat.value) {
    return base.filter(r => r.seat === mobileSeat.value);
  }
  return base;
});

function hypotheticalMark(row: BaseStatusRow) {
  return row.hypotheticalLabel
    ? h(resolveComponent('UBadge'), { color: 'neutral', variant: 'outline', size: 'sm', class: 'ml-1 font-normal', title: row.hypotheticalLabel, 'data-testid': 'hypothetical-row' }, () => 'hypothetical')
    : null;
}

function highlightClass(row: BaseStatusRow): string {
  return row.isAnchorCurrentQualification ? 'font-bold text-primary' : '';
}

const columns: TableColumn<BaseStatusRow>[] = [
  { accessorKey: 'base', header: 'Base', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.base) },
  { accessorKey: 'seat', header: 'Seat', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.seat) },
  { accessorKey: 'fleet', header: 'Fleet', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.fleet) },
  { accessorKey: 'rank', header: 'Rank', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, [row.original.rank, hypotheticalMark(row.original)]) },
  { accessorKey: 'rosterSize', header: 'Roster Size', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.rosterSize) },
  { accessorKey: 'seniorityPercentile', header: 'Seniority Percentile', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, `${row.original.seniorityPercentile}%`) },
];

// 4 columns on mobile — Roster Size dropped (Rank + Seniority Percentile convey the same standing)
const mobileColumns: TableColumn<BaseStatusRow>[] = [
  { accessorKey: 'base', header: 'Base', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.base) },
  { accessorKey: 'fleet', header: 'Fleet', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.fleet) },
  { accessorKey: 'rank', header: 'Rank', cell: ({ row }) => h('span', { class: `font-mono ${highlightClass(row.original)}` }, [row.original.rank, hypotheticalMark(row.original)]) },
  { accessorKey: 'seniorityPercentile', header: 'Seniority Percentile', cell: ({ row }) => h('span', { class: `font-mono ${highlightClass(row.original)}` }, `${row.original.seniorityPercentile}%`) },
];
</script>

<template>
  <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-5' }">
    <template #header>
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <h3 class="font-semibold text-highlighted">Status by Base / Seat / Fleet</h3>
      </div>
    </template>

    <p v-if="noResultLabel" data-testid="no-result" class="px-3 py-4 font-mono font-semibold text-highlighted">{{ noResultLabel }}</p>
    <template v-else>
    <p class="px-3 pt-3 sm:px-0 sm:pt-0 pb-2 text-xs text-muted">
      Rank is your position among active pilots; Roster Size includes retired pilots.
      Rows marked hypothetical place you in a qualification you are not in and count you in its Roster Size.
    </p>

    <!-- Mobile: seat filter dropdown -->
    <div v-if="isMobile && availableSeats.length > 1" class="flex gap-2 px-3 pt-3 pb-2">
      <UButton
        v-for="seat in availableSeats"
        :key="seat"
        size="xs"
        :variant="mobileSeat === seat ? 'solid' : 'outline'"
        color="neutral"
        @click="mobileSeat = seat"
      >
        {{ seat === 'CA' ? 'Captain' : seat === 'FO' ? 'First Officer' : seat }}
      </UButton>
    </div>

    <!-- Desktop: full table -->
    <div v-if="!isMobile" class="overflow-x-auto">
      <UTable :data="displayData" :columns="columns" />
    </div>

    <!-- Mobile: compact table with fewer columns and tighter cell spacing -->
    <UTable
      v-else
      :data="displayData"
      :columns="mobileColumns"
      :ui="{ th: 'px-2 py-2 text-xs font-semibold', td: 'px-2 py-2 text-xs whitespace-nowrap' }"
    />
    </template>
  </UCard>
</template>
