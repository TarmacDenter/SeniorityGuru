<script setup lang="ts">
import type { HoldabilityDetailView, HoldabilitySeatGroup } from '~/composables/seniority'

// Current › Holdability: every Qualification by seat with today's Rank and its Holdable Year. Choosing a
// Qualification opens its chart; the company-wide Qualification scale with Project forward follows.
defineProps<{
  loading: boolean
  userFound: boolean
  groups: HoldabilitySeatGroup[]
  /** Why no Rank exists (e.g. "Anchor Pilot retired"); replaces the Qualifications when set. */
  noResultLabel: string | null
  columnLabels: { qualification: string, rank: string, rosterSize: string, percentile: string, status: string }
  selectedKey: string | null
  detail: HoldabilityDetailView | null
  juniorCaptainsLink: string
  seatOptions: { label: string, value: string }[]
  selectedSeat: string | null
}>()

const emit = defineEmits<{ 'select': [key: string], 'update:selectedSeat': [seat: string] }>()
</script>

<template>
  <div class="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl space-y-6">
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-6 w-48" />
      <USkeleton class="h-64" />
    </div>

    <template v-else>
      <UEmpty
        v-if="!userFound"
        icon="i-lucide-layout-list"
        title="No Qualifications yet"
        description="Enter your employee number to see where you stand in every Qualification."
        :actions="[{ label: 'Open Settings', icon: 'i-lucide-settings', to: '/settings', size: 'lg' as const }]"
        class="py-10"
      />

      <template v-else>
        <DashboardHoldabilityCard
          selectable
          :selected-seat="selectedSeat"
          :groups="groups"
          :no-result-label="noResultLabel"
          :column-labels="columnLabels"
          :selected-key="selectedKey"
          :detail="detail"
          :junior-captains-link="juniorCaptainsLink"
          :seat-options="seatOptions"
          @select="emit('select', $event)"
          @update:selected-seat="emit('update:selectedSeat', $event)"
        />

        <DashboardQualificationPositions v-if="!noResultLabel" />
      </template>
    </template>
  </div>
</template>
