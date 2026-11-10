<script setup lang="ts">
import { useNextProjections } from '~/composables/seniority'

// Landing hero: the demo pilot's Seniority Percentile over time, company-wide with default Growth Assumptions.
// Render inside <LandingShowcase>, which provides the demo core.
const { projectionChart, endedByLabel, percentileScaleLabel } = useNextProjections()
</script>

<template>
  <DashboardTrajectoryChart :data="projectionChart" :ended-by-label="endedByLabel">
    <template #footer>
      <p class="mt-1 text-xs text-muted">
        Sample pilot from the demo list<template v-if="percentileScaleLabel"> · {{ percentileScaleLabel }}</template>
      </p>
    </template>
  </DashboardTrajectoryChart>
</template>
