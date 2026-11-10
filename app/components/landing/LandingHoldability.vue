<script setup lang="ts">
import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS } from '~/utils/seniority'
import { useHoldability } from '~/composables/seniority'

// Render inside <LandingShowcase>: the demo list's Holdability for the sample pilot, Captain first.
const { visibleGroups, seatOptions, selectedSeat, noResultLabel, columnLabels } = useHoldability(
  ref({}),
  ref({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS }),
)

// Start on Captain when the list has it; afterwards the pilot's seat switch rules.
if (seatOptions.value.some(option => option.value === 'CA')) selectedSeat.value = 'CA'
</script>

<template>
  <DashboardHoldabilityCard
    v-model:selected-seat="selectedSeat"
    :groups="visibleGroups"
    :seat-options="seatOptions"
    :no-result-label="noResultLabel"
    :column-labels="columnLabels"
  >
    <template #footer>
      <p class="text-xs text-muted">Sample pilot from the demo list</p>
    </template>
  </DashboardHoldabilityCard>
</template>
