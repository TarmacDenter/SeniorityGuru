<script setup lang="ts">
import type { useQualDemographics } from '~/composables/useQualDemographics'

defineProps<{
  demographics: ReturnType<typeof useQualDemographics>
}>()
</script>

<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <div class="flex gap-3 flex-wrap items-center">
    <USelect
      :model-value="demographics.selectedFleet.value ?? undefined"
      :items="demographics.availableFleets.value"
      placeholder="All Fleets"
      class="w-40"
      @update:model-value="demographics.selectedFleet.value = $event ?? null"
    />
    <USelect
      :model-value="demographics.selectedSeat.value ?? undefined"
      :items="demographics.availableSeats.value"
      placeholder="All Seats"
      class="w-40"
      @update:model-value="demographics.selectedSeat.value = $event ?? null"
    />
    <USelect
      :model-value="demographics.selectedBase.value ?? undefined"
      :items="demographics.availableBases.value"
      placeholder="All Bases"
      class="w-40"
      @update:model-value="demographics.selectedBase.value = $event ?? null"
    />
    <UButton
      v-if="demographics.selectedFleet.value || demographics.selectedSeat.value || demographics.selectedBase.value"
      size="sm"
      color="neutral"
      variant="ghost"
      icon="i-lucide-x"
      @click="demographics.clearFilter()"
    >
      Clear filter
    </UButton>
  </div>
  <!-- eslint-enable vue/no-mutating-props -->
</template>
