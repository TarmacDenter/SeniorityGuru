<script setup lang="ts">
import { useNextProjections } from '~/composables/seniority'
import { useTrajectoryAssumptionsNote } from '~/composables/useTrajectoryAssumptionsNote'

// Trajectory › Projection: the trajectory chart with its scope overlay beside the Percentile Threshold
// calculator, then one yearly-change table in the scenario's Qualification Scope.
const props = defineProps<{
  loading: boolean
  hasData: boolean
  userFound: boolean
}>()

const {
  projectionChart,
  compareScopeLabel,
  compareScopeItems,
  changes,
  bestYearLabel,
  hypotheticalLabel,
  endedByLabel,
  percentileScaleLabel,
  scopeSuffix,
  threshold,
} = useNextProjections()
const assumptionsNote = useTrajectoryAssumptionsNote()

const emptyAction = computed(() => props.hasData
  ? { label: 'Enter your employee number', icon: 'i-lucide-user-round', to: '/settings', size: 'lg' as const }
  : { label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const })
</script>

<template>
  <div class="px-4 sm:px-6 py-4 sm:py-6 max-w-6xl">
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-6 w-48" />
      <USkeleton class="h-72" />
    </div>

    <UEmpty
      v-else-if="!hasData || !userFound"
      icon="i-lucide-trending-up"
      title="No trajectory yet"
      description="Upload a seniority list and enter your employee number to see how your Seniority Percentile moves as pilots senior to you retire."
      :actions="[emptyAction]"
      class="py-24"
    />

    <div v-else class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Your Seniority Percentile over time</h2>
        <UBadge v-if="hypotheticalLabel" data-testid="hypothetical-placement" color="neutral" variant="outline">
          {{ hypotheticalLabel }}
        </UBadge>
      </div>

      <AnalyticsAssumptionsBanner
        :is-banner-dismissed="assumptionsNote.dismissed.value"
        context="trajectory"
        @dismiss="assumptionsNote.toggle"
      />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardTrajectoryChart :data="projectionChart" :ended-by-label="endedByLabel" class="lg:col-span-2">
          <template #controls>
            <div class="flex items-center gap-2">
              <label for="compare-scope" class="text-xs text-muted">Compare with</label>
              <USelect
                id="compare-scope"
                v-model="compareScopeLabel"
                :items="compareScopeItems"
                placeholder="Scope"
                size="xs"
                class="min-w-32"
              />
              <UButton
                v-if="compareScopeLabel"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Clear comparison"
                @click="compareScopeLabel = undefined"
              />
            </div>
          </template>
          <template #footer>
            <p v-if="percentileScaleLabel" data-testid="trajectory-roster-size" class="mt-1 text-xs text-muted">{{ percentileScaleLabel }}</p>
            <UBadge v-if="projectionChart.overlay?.hypotheticalLabel" color="neutral" variant="outline" size="sm" class="mt-2">
              {{ projectionChart.overlay.hypotheticalLabel }}
            </UBadge>
          </template>
        </DashboardTrajectoryChart>

        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">Percentile Threshold{{ scopeSuffix }}</h3>
          </template>
          <AnalyticsPercentileThresholdCalculator
            :result="threshold.result.value"
            :no-result-label="threshold.noResultLabel.value"
            :target-percentile="threshold.target.value"
            :min-percentile="threshold.min.value"
            :max-percentile="threshold.max.value"
            :has-employee-number="userFound"
            @percentile-change="threshold.target.value = $event"
          />
        </UCard>
      </div>

      <DashboardYearlyChange
        v-if="changes.length > 0"
        :changes="changes"
        :best-year-label="bestYearLabel"
        :scope-suffix="scopeSuffix"
      />
    </div>
  </div>
</template>
