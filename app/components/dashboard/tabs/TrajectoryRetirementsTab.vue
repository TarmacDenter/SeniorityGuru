<script setup lang="ts">
import { useNextProjections } from '~/composables/seniority'

// Trajectory › Retirements: the Retirement Wave with an N-year count with the trajectory over it,
// and Retirement Projections across Qualification Scopes.
defineProps<{
  loading: boolean
  hasData: boolean
  userFound: boolean
}>()

const {
  computeRetirementProjection,
  scopeOptions,
  scopeSuffix,
  seniorRetirements,
  retirementWave,
  wavePercentileSeries,
} = useNextProjections()

// The thumb moves live; the count follows once it rests.
const years = useSettledModel(seniorRetirements.years)
</script>

<template>
  <div class="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl">
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-6 w-48" />
      <USkeleton class="h-72" />
    </div>

    <UEmpty
      v-else-if="!hasData || !userFound"
      icon="i-lucide-trending-up"
      title="No trajectory yet"
      description="Upload a seniority list and enter your employee number to see which retirements move you."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24"
    />

    <div v-else class="space-y-6">
      <UCard v-if="retirementWave.length > 0">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <h3 class="text-lg font-semibold text-highlighted">Retirement Wave{{ scopeSuffix }}</h3>
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
      </UCard>

      <DashboardRetirementComparison
        :qualification-scope-options="scopeOptions"
        :compute-projection="computeRetirementProjection"
      />
    </div>
  </div>
</template>
