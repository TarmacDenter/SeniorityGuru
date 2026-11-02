<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { useMediaQuery } from '@vueuse/core';
import type { BaseStatusRow, QualificationSeatGroup } from '~/composables/seniority';

// Status by Base / Seat / Fleet: the Anchor Pilot's Base Rank in every Qualification today.
// Rows arrive grouped by seat and ordered by the composable; on a phone one seat shows at a time.
const props = defineProps<{
  groups: QualificationSeatGroup[];
  /** Why no Rank exists (e.g. "Anchor Pilot retired"); replaces the table when set. */
  noResultLabel?: string | null;
}>();

const isMobile = useMediaQuery('(max-width: 639px)');
const mobileSeat = ref<string | undefined>(undefined);

// Open on the seat that holds your own Qualification, so your Base Rank row is visible first.
watch(() => props.groups, (groups) => {
  if (groups.some(group => group.seat === mobileSeat.value)) return;
  mobileSeat.value = (groups.find(group => group.rows.some(row => row.isAnchorCurrentQualification)) ?? groups[0])?.seat;
}, { immediate: true });

const displayData = computed<BaseStatusRow[]>(() => isMobile.value
  ? props.groups.find(group => group.seat === mobileSeat.value)?.rows ?? []
  : props.groups.flatMap(group => group.rows));

function hypotheticalMark(row: BaseStatusRow) {
  return row.hypotheticalLabel
    ? h(resolveComponent('UBadge'), { color: 'neutral', variant: 'outline', size: 'sm', class: 'ml-1 font-normal whitespace-normal', 'data-testid': 'hypothetical-row' }, () => row.hypotheticalLabel)
    : null;
}

const numeric = { class: { th: 'text-right', td: 'text-right font-mono' } };
const columns: TableColumn<BaseStatusRow>[] = [
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'fleet', header: 'Fleet' },
  { id: 'rank', header: 'Base Rank', meta: numeric, cell: ({ row }) => h('span', null, [row.original.rankLabel, hypotheticalMark(row.original)]) },
  { accessorKey: 'rosterOfLabel', header: 'Roster Size', meta: numeric },
  { accessorKey: 'percentileLabel', header: 'Seniority Percentile', meta: numeric },
];

const meta = {
  class: {
    tr: (row: { original: BaseStatusRow }) => row.original.isAnchorCurrentQualification ? '[&>td]:font-bold [&>td]:text-highlighted' : '',
  },
};
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }" data-testid="base-status">
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-highlighted">Status by Base / Seat / Fleet</h2>
        <UPopover v-if="!noResultLabel">
          <UButton icon="i-lucide-info" color="neutral" variant="ghost" size="xs" aria-label="About this table" />
          <template #content>
            <p class="max-w-xs p-3 text-sm text-default">
              Base Rank is your position among active pilots in each Qualification; Roster Size includes retired pilots.
              Rows marked hypothetical place you in a Qualification you are not in and count you in its Roster Size.
            </p>
          </template>
        </UPopover>
      </div>
    </template>

    <p v-if="noResultLabel" data-testid="no-result" class="px-4 py-4 font-mono font-semibold text-highlighted">{{ noResultLabel }}</p>
    <template v-else>
      <div v-if="isMobile && groups.length > 1" class="flex gap-2 px-3 pt-3 pb-1">
        <UButton
          v-for="group in groups"
          :key="group.seat"
          size="xs"
          :variant="mobileSeat === group.seat ? 'solid' : 'outline'"
          color="neutral"
          @click="mobileSeat = group.seat"
        >
          {{ group.seatLabel }}
        </UButton>
      </div>

      <div class="overflow-x-auto">
        <UTable
          :data="displayData"
          :columns="columns"
          :meta="meta"
          :column-visibility="{ seat: !isMobile, rosterOfLabel: !isMobile }"
          :ui="{ th: 'px-3 py-1.5 text-xs font-medium text-muted', td: 'px-3 py-1.5 text-sm whitespace-nowrap' }"
        />
      </div>
    </template>
  </UCard>
</template>
