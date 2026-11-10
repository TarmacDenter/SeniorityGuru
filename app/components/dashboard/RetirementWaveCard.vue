<script setup lang="ts">
import { useNextProjections } from '~/composables/seniority'

// The Retirement Wave with the Seniority Percentile over it and the "Retirements within" slider.
// Shared by Trajectory › Retirements and the landing page.
defineProps<{ title?: string }>()

const { seniorRetirements, retirementWave, wavePercentileSeries, scopeSuffix } = useNextProjections()

// The thumb moves live; the count follows once it rests.
const years = useSettledModel(seniorRetirements.years)
</script>

<template>
  <UCard v-if="retirementWave.length > 0">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h3 class="text-lg font-semibold text-highlighted">{{ title ?? `Retirement Wave${scopeSuffix}` }}</h3>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <label for="retirements-within" class="whitespace-nowrap text-sm text-muted">Retirements within</label>
          <USlider
            id="retirements-within"
            v-model="years"
            :min="1"
            :max="seniorRetirements.maxYears.value"
            :step="1"
            size="sm"
            class="w-32 sm:w-44"
            aria-label="Retirements within years"
          />
          <span class="font-mono text-sm font-semibold text-highlighted" aria-live="polite">{{ seniorRetirements.label.value }}</span>
        </div>
      </div>
    </template>
    <AnalyticsRetirementWaveChart
      :wave-buckets="retirementWave"
      :percentile-series="wavePercentileSeries"
      :qualification-scope="scopeSuffix"
    />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
