<script setup lang="ts">
import { useDashboardList } from '~/composables/useDashboardList'
import type { ListExcerptRow, QualificationSeatGroup, RankCardData, StandingFigure } from '~/composables/seniority'

// Current › Status: the headline figures, the Seniority List around the Anchor Pilot's line,
// and the Status by Base / Seat / Fleet table, all in one pass. Without an Anchor Pilot it only asks for one.
defineProps<{
  loading: boolean
  hasData: boolean
  hasEmployeeNumber: boolean
  userFound: boolean
  isNewHireMode: boolean
  rankCard: RankCardData
  figures: StandingFigure[]
  excerptRows: ListExcerptRow[]
  qualificationGroups: QualificationSeatGroup[]
}>()

const { holdabilityLink, retiredAheadLink, seniorRetirementsNextYearLink } = useDashboardList()
const noteLinks = computed(() => ({ retiredAhead: retiredAheadLink.value, seniorRetirementsNextYear: seniorRetirementsNextYearLink.value }))
</script>

<template>
  <div class="px-4 sm:px-6 py-4 sm:py-6 max-w-6xl">
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-6 w-48" />
      <USkeleton class="h-64" />
      <USkeleton class="h-32" />
    </div>

    <UEmpty
      v-else-if="!hasData"
      icon="i-lucide-list-ordered"
      title="No Seniority Data Yet"
      description="Upload your airline's seniority list to see your position, track retirements, and project your trajectory."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24"
    />

    <div v-else-if="!userFound" class="max-w-xl space-y-3 py-8">
      <p v-if="hasEmployeeNumber" class="text-sm text-default">Your employee number is not on this list.</p>
      <DashboardEmployeeNumberBanner />
      <p class="text-sm text-muted">
        Not on the list yet?
        <ULink to="/settings" class="text-highlighted underline">Turn on New Hire Mode in Settings</ULink>.
      </p>
    </div>

    <div v-else class="space-y-6">
      <DashboardNewHireModeBanner v-if="isNewHireMode" />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <DashboardStandingCard :rank-card="rankCard" :figures="figures" :note-links="noteLinks" class="lg:order-2" />
        <DashboardListExcerptCard :rows="excerptRows" class="lg:order-1" />
      </div>

      <DashboardBaseStatusTable :groups="qualificationGroups" :no-result-label="rankCard.noResultLabel" />
      <UButton label="Open Holdability" :to="holdabilityLink" color="neutral" variant="link" size="sm" trailing-icon="i-lucide-arrow-right" class="px-0" />
    </div>
  </div>
</template>
