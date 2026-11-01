<script setup lang="ts">
import { useQualificationPositions } from '~/composables/seniority'

// Where the Anchor Pilot stands in every Qualification, today or projected forward under the shared Growth Assumptions.
const { growthAssumptions } = useScenario()
const { positions, noResultLabel, projectForward, years, projectionLabel, sliderMax } = useQualificationPositions(growthAssumptions)
</script>

<template>
  <section aria-labelledby="positions-heading" class="mt-10 space-y-4">
    <div>
      <h2 id="positions-heading" class="font-serif text-xl font-semibold text-highlighted">Seniority Position by Qual</h2>
      <p class="mt-1 font-serif text-sm italic text-muted">Holdable is a modeled outcome, not a vacancy or an award.</p>
    </div>

    <p v-if="noResultLabel" data-testid="no-result" class="font-mono font-semibold text-highlighted">{{ noResultLabel }}</p>

    <template v-else-if="positions.length > 0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-default py-2">
        <label class="flex items-center gap-2 font-sans text-sm text-muted">
          <AppSwitch v-model="projectForward" size="sm" :disabled="sliderMax === 0" aria-label="Project forward" />
          <span>Project forward</span>
        </label>
        <template v-if="projectForward">
          <USlider v-model="years" :min="1" :max="sliderMax" :step="1" class="w-48" aria-label="Years to project forward" />
          <span class="font-mono text-sm text-highlighted">+{{ years }}yr{{ years === 1 ? '' : 's' }}</span>
        </template>
        <span v-if="sliderMax === 0" class="font-sans text-sm text-muted">Add a retirement date to project forward.</span>
        <span class="font-mono text-sm text-muted">{{ projectionLabel }}</span>
      </div>

      <UCollapsible>
        <UButton label="About this view" color="neutral" variant="link" size="sm" trailing-icon="i-lucide-chevron-down" class="px-0" />
        <template #content>
          <div class="space-y-2 border-l-2 border-default pl-3 font-serif text-sm text-muted">
            <p>The scale compares your company Seniority Percentile across Qualifications (Base, Seat and Fleet combinations).</p>
            <p>Holdable means your projected company Seniority Percentile meets or exceeds the unchanged current Qualification Threshold. Future occupancy, vacancies, bids, transfers and awards are not modeled, and Holdable does not guarantee a position.</p>
            <NuxtLink to="/how-it-works#holdability" class="font-sans text-highlighted underline">Learn more about Holdable and Qualification Thresholds</NuxtLink>
          </div>
        </template>
      </UCollapsible>

      <AnalyticsQualSeniorityScale :positions="positions" />
    </template>
  </section>
</template>
