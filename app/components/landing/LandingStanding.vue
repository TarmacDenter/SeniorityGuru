<script setup lang="ts">
import { useListExcerpt, useStanding } from '~/composables/seniority'

// Landing "Where you stand today": the demo pilot's line on the list and the Standing figures.
// Figure notes that would open the dashboard emit `open-demo` instead, since a visitor has no list yet.
// Render inside <LandingShowcase>, which provides the demo core.
defineEmits<{ 'open-demo': [] }>()

const { rankCard, figures } = useStanding()
const { rows } = useListExcerpt(2)
</script>

<template>
  <div class="space-y-3">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <DashboardStandingCard
        :rank-card="rankCard"
        :figures="figures"
        class="lg:order-2"
        @note-click="$emit('open-demo')"
      />
      <DashboardListExcerptCard :rows="rows" class="lg:order-1" />
    </div>
    <p class="text-xs text-muted">Sample pilot from the demo list</p>
    <p class="text-sm text-muted">Not on the list yet? New Hire Mode estimates your starting position.</p>
  </div>
</template>
