<script setup lang="ts">
import { useNextProjections } from '~/composables/seniority'

// Landing hero: the demo pilot's Seniority Percentile over time, company-wide with default Growth Assumptions.
// Render inside <LandingShowcase>, which provides the demo core.
const { projectionChart, endedByLabel, percentileScaleLabel } = useNextProjections()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-highlighted">Your Seniority Percentile over time</h2>
        <UPopover v-if="percentileScaleLabel">
          <UButton icon="i-lucide-info" color="neutral" variant="ghost" size="xs" aria-label="About the Seniority Percentile" />
          <template #content>
            <p class="max-w-xs p-3 text-sm text-default">
              {{ percentileScaleLabel }}. A Seniority Percentile of 100 is the most senior end.
            </p>
          </template>
        </UPopover>
      </div>
    </template>

    <DashboardTrajectoryChart :data="projectionChart" :ended-by-label="endedByLabel" />

    <p class="mt-3 text-xs text-muted">Sample pilot from the demo list</p>
  </UCard>
</template>
