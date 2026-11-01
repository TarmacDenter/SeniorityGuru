<script setup lang="ts">
import { useUpcomingRetirements } from '~/composables/seniority/modules/useUpcomingRetirements'
import type { RetirementSortKey } from '~/composables/seniority/modules/useUpcomingRetirements'

// List › Upcoming retirements. Range, scope, filtering, sorting and labels come from the composable.
const {
  hasData, hasAnchor, yearsHorizon, horizonMax, horizonLabel, emptyResultLabel, seniorOnly,
  filterBase, filterSeat, filterFleet, baseItems, seatItems, fleetItems, sortKey, sortDir, toggleSort, rows,
} = useUpcomingRetirements()

const sortableColumns = computed<{ key: RetirementSortKey; label: string; align: string }[]>(() => [
  { key: 'seniorityNumber', label: 'Seniority Number', align: 'text-right' },
  ...(hasAnchor.value ? [{ key: 'rankRelativeToMe' as const, label: 'Rank relative to me', align: 'text-right' }] : []),
  { key: 'retirementDate', label: 'Estimated retirement date', align: 'text-right' },
])

function ariaSort(key: RetirementSortKey) {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}
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
        <USlider id="retiring-within" v-model="yearsHorizon" :min="1" :max="horizonMax" :step="1" size="sm" class="w-40 sm:w-56" aria-label="Retiring within years" />
        <span class="whitespace-nowrap font-mono text-sm font-semibold text-highlighted" aria-live="polite">{{ horizonLabel }}</span>
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

      <div class="overflow-x-auto">
        <table class="w-full border-collapse font-mono text-sm sm:text-base" aria-label="Upcoming retirements">
          <thead>
            <tr class="border-b border-default font-sans text-xs font-medium text-muted">
              <th v-for="column in sortableColumns.slice(0, 1)" :key="column.key" scope="col" :aria-sort="ariaSort(column.key)" class="px-2 py-1.5" :class="column.align">
                <button type="button" class="inline-flex items-center gap-1" @click="toggleSort(column.key)">
                  {{ column.label }}
                  <UIcon :name="sortKey === column.key && sortDir === 'desc' ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="size-3" :class="sortKey === column.key ? 'text-highlighted' : 'text-dimmed'" />
                </button>
              </th>
              <th scope="col" class="px-2 py-1.5 text-left">Qualification</th>
              <th v-for="column in sortableColumns.slice(1)" :key="column.key" scope="col" :aria-sort="ariaSort(column.key)" class="px-2 py-1.5" :class="column.align">
                <button type="button" class="inline-flex items-center gap-1" @click="toggleSort(column.key)">
                  {{ column.label }}
                  <UIcon :name="sortKey === column.key && sortDir === 'desc' ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="size-3" :class="sortKey === column.key ? 'text-highlighted' : 'text-dimmed'" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key" class="even:bg-accented">
              <td class="px-2 py-2 text-right">{{ row.seniorityNumber }}</td>
              <td class="px-2 py-2 text-left">{{ row.qualificationLabel }}</td>
              <td v-if="hasAnchor" class="px-2 py-2 text-right">{{ row.relativeLabel }}</td>
              <td class="px-2 py-2 text-right">{{ row.retirementDateLabel }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="rows.length === 0" class="py-12 text-center">
          <p class="font-medium text-highlighted">No retirements found</p>
          <p class="mt-1 text-sm text-muted">{{ emptyResultLabel }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
