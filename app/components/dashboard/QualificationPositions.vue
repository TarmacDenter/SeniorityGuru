<script setup lang="ts">
import { useQualificationPositions } from '~/composables/seniority'

// Where the Anchor Pilot stands in every Qualification, today or projected forward under the shared Growth Assumptions.
const { growthAssumptions } = useScenario()
const { positions, noResultLabel, projectForward, years, projectionLabel, sliderMax } = useQualificationPositions(growthAssumptions)
</script>

<template>
  <UCard as="section" aria-labelledby="positions-heading">
    <template #header>
      <div class="flex items-center gap-1.5">
        <h2 id="positions-heading" class="font-semibold text-highlighted">Seniority Position by Qual</h2>
        <UPopover>
          <UButton icon="i-lucide-info" color="neutral" variant="ghost" size="xs" aria-label="About this scale" />
          <template #content>
            <div class="max-w-xs space-y-2 p-3 text-sm text-muted">
              <p>The scale compares your company Seniority Percentile across Qualifications (Base, Seat and Fleet combinations).</p>
              <p>Holdable is a modeled outcome, not a vacancy or an award. Future occupancy, vacancies, bids, transfers and awards are not modeled.</p>
            </div>
          </template>
        </UPopover>
      </div>
    </template>

    <p v-if="noResultLabel" data-testid="no-result" class="font-mono font-semibold text-highlighted">{{ noResultLabel }}</p>

    <div v-else-if="positions.length > 0" class="space-y-4">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label class="flex items-center gap-2 text-sm text-muted">
          <AppSwitch v-model="projectForward" size="sm" :disabled="sliderMax === 0" aria-label="Project forward" />
          <span>Project forward</span>
        </label>
        <template v-if="projectForward">
          <USlider v-model="years" :min="1" :max="sliderMax" :step="1" class="w-48" aria-label="Years to project forward" />
          <span class="font-mono text-sm text-highlighted">+{{ years }}yr{{ years === 1 ? '' : 's' }}</span>
        </template>
        <span v-if="sliderMax === 0" class="text-sm text-muted">Add a retirement date to project forward.</span>
        <span class="font-mono text-sm text-muted">{{ projectionLabel }}</span>
      </div>

      <AnalyticsQualSeniorityScale :positions="positions" />
    </div>
  </UCard>
</template>
