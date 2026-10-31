<script setup lang="ts">
import { h } from 'vue';
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
};

const props = defineProps<{
  data: BaseStatusRow[];
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

const userCanHold = (row: BaseStatusRow): boolean => {
  return row.rank <= row.activePilotCount;
};

function highlightClass(row: BaseStatusRow): string {
  if (!userCanHold(row)) {
    return 'text-past';
  }
  return row.isAnchorCurrentQualification ? 'font-bold text-primary' : '';
}

const columns: TableColumn<BaseStatusRow>[] = [
  { accessorKey: 'base', header: 'Base', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.base) },
  { accessorKey: 'seat', header: 'Seat', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.seat) },
  { accessorKey: 'fleet', header: 'Fleet', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.fleet) },
  { accessorKey: 'rank', header: 'Rank', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.rank) },
  { accessorKey: 'rosterSize', header: 'Roster Size', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.rosterSize) },
  { accessorKey: 'seniorityPercentile', header: 'Base %ile', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, `${row.original.seniorityPercentile}%`) },
];

// 4 columns on mobile — Total dropped (Rank + Base %ile convey the same standing)
const mobileColumns: TableColumn<BaseStatusRow>[] = [
  { accessorKey: 'base', header: 'Base', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.base) },
  { accessorKey: 'fleet', header: 'Fleet', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.fleet) },
  { accessorKey: 'rank', header: 'Rank', cell: ({ row }) => h('span', { class: `font-mono ${highlightClass(row.original)}` }, row.original.rank) },
  { accessorKey: 'seniorityPercentile', header: 'Base %ile', cell: ({ row }) => h('span', { class: `font-mono ${highlightClass(row.original)}` }, `${row.original.seniorityPercentile}%`) },
];
</script>

<template>
  <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-5' }">
    <template #header>
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <h3 class="font-semibold text-highlighted">Status by Base / Seat / Fleet</h3>
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

    <!-- Mobile: compact table with fewer columns and tighter cell spacing -->
    <UTable
      v-else
      :data="displayData"
      :columns="mobileColumns"
      :ui="{ th: 'px-2 py-2 text-xs font-semibold', td: 'px-2 py-2 text-xs whitespace-nowrap' }"
    />
  </UCard>
</template>
