<script setup lang="ts">
import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { useMediaQuery } from '@vueuse/core';

type BaseStatusRow = {
  base: string;
  seat: string;
  fleet: string;
  rank: number;
  adjustedRank: number;
  total: number;
  adjustedTotal: number;
  percentile: number;
  adjustedPercentile: number;
  isUserCurrent: boolean;
};

type DisplayRow = BaseStatusRow & {
  displayRank: number;
  displayTotal: number;
  displayPercentile: number;
};

const props = defineProps<{
  data: BaseStatusRow[];
}>();

const adjusted = ref(true);
const isMobile = useMediaQuery('(max-width: 639px)');

// Mobile seat filter — default to first available seat
const availableSeats = computed(() => [...new Set(props.data.map(r => r.seat))].sort());
const mobileSeat = ref<string | undefined>(undefined);

// Auto-select first seat when data loads
watch(availableSeats, (seats) => {
  if (seats.length && !mobileSeat.value) mobileSeat.value = seats[0];
}, { immediate: true });

const displayData = computed<DisplayRow[]>(() => {
  const base = props.data.map((row) => ({
    ...row,
    displayRank: adjusted.value ? row.adjustedRank : row.rank,
    displayTotal: adjusted.value ? row.adjustedTotal : row.total,
    displayPercentile: adjusted.value ? row.adjustedPercentile : row.percentile,
  }));
  // On mobile, filter by selected seat to reduce rows
  if (isMobile.value && mobileSeat.value) {
    return base.filter(r => r.seat === mobileSeat.value);
  }
  return base;
});

const userCanHold = (row: DisplayRow): boolean => {
  return row.displayRank <= row.displayTotal;
};

function highlightClass(row: DisplayRow): string {
  if (!userCanHold(row)) {
    return 'text-past';
  }
  return row.isUserCurrent ? 'font-bold text-primary' : '';
}

const columns: TableColumn<DisplayRow>[] = [
  { accessorKey: 'base', header: 'Base', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.base) },
  { accessorKey: 'seat', header: 'Seat', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.seat) },
  { accessorKey: 'fleet', header: 'Fleet', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.fleet) },
  { accessorKey: 'displayRank', header: 'Rank', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.displayRank) },
  { accessorKey: 'displayTotal', header: 'Total', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.displayTotal) },
  { accessorKey: 'displayPercentile', header: 'TOP %', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, `${row.original.displayPercentile}%`) },
];

const mobileColumns: TableColumn<DisplayRow>[] = [
  { accessorKey: 'base', header: 'Base', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.base) },
  { accessorKey: 'fleet', header: 'Fleet', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.fleet) },
  { accessorKey: 'displayRank', header: 'Rank', cell: ({ row }) => h('span', { class: `font-mono ${highlightClass(row.original)}` }, row.original.displayRank) },
  { accessorKey: 'displayTotal', header: 'Total', cell: ({ row }) => h('span', { class: `font-mono ${highlightClass(row.original)}` }, row.original.displayTotal) },
  { accessorKey: 'displayPercentile', header: 'TOP%', cell: ({ row }) => h('span', { class: `font-mono ${highlightClass(row.original)}` }, `${row.original.displayPercentile}%`) },
];
</script>

<template>
  <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-5' }">
    <template #header>
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <h3 class="font-semibold text-highlighted">Status by Base / Seat / Fleet</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted">Adjusted</span>
          <InfoIcon text="Adjusted rank and total exclude retired pilots. Raw rank includes everyone on the original list." size="xs" />
          <USwitch v-model="adjusted" size="xs" />
        </div>
      </div>
    </template>

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

    <!-- Mobile: compact table with fewer columns -->
    <UTable v-else :data="displayData" :columns="mobileColumns" class="text-xs" />
  </UCard>
</template>
