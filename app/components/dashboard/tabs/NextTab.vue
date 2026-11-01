<script setup lang="ts">
import type { PresentedTrajectoryChange } from '~/utils/seniority'
import { useNextProjections } from '~/composables/seniority'

// The Next panel: the trajectory chart and key changes, then the analysis behind them:
// improvement rate, scope comparison, retirement snapshot, wave, threshold and projections.
defineProps<{
  loading: boolean
  hasData: boolean
  userFound: boolean
  chartData: { labels: string[]; data: number[] }
  /** Why the plotted trajectory stops early, e.g. "Anchor Pilot retired"; null when it runs its full window. */
  endedByLabel: string | null
  keyChanges: PresentedTrajectoryChange[]
  hypotheticalLabel: string | null
}>()

const {
  changes,
  bestYearLabel,
  computeComparativeTrajectory,
  computeRetirementProjection,
  scopeOptions,
  scopeSuffix,
  rosterSummaryLabel,
  snapshot,
  snapshotYears,
  snapshotMaxYears,
  retirementWave,
  wavePoints,
  threshold,
  projectForward,
  yearsInput,
  sliderMax,
  canProjectForward,
  yearsLabel,
  asOfLabel,
  qualificationPositions,
  qualificationPositionsNoResultLabel,
  hasProjection,
} = useNextProjections()
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
      description="Upload a seniority list and enter your employee number to see how your Seniority Percentile moves as pilots senior to you retire."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24"
    />

    <template v-else>
      <h2 class="font-serif text-xl font-semibold text-highlighted">Your Seniority Percentile over time</h2>
      <p
        v-if="hypotheticalLabel"
        data-testid="hypothetical-placement"
        class="mt-2 inline-block -rotate-1 border-2 border-stamp px-2 py-0.5 font-sans text-sm font-semibold text-stamp"
      >
        {{ hypotheticalLabel }}
      </p>

      <div class="mt-4">
        <DashboardTrajectoryChart :data="chartData" :ended-by-label="endedByLabel" />
      </div>

      <section v-if="keyChanges.length > 0" class="mt-6" aria-labelledby="key-changes-heading">
        <h3 id="key-changes-heading" class="font-serif text-lg font-semibold text-highlighted">Key changes</h3>
        <table class="mt-2 w-full border-collapse font-mono text-sm sm:text-base">
          <thead>
            <tr class="border-b border-highlighted font-sans text-xs font-medium text-muted">
              <th scope="col" class="px-2 py-1.5 text-left">Year</th>
              <th scope="col" class="px-2 py-1.5 text-right">Change</th>
              <th scope="col" class="px-2 py-1.5 text-right">Seniority Percentile</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="change in keyChanges" :key="change.yearLabel" class="even:bg-accented">
              <td class="px-2 py-2 text-left">{{ change.yearLabel }}</td>
              <td class="px-2 py-2 text-right">{{ change.changeLabel }}</td>
              <td class="px-2 py-2 text-right">{{ change.percentileLabel }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardTrajectoryDeltaSparkline v-if="changes.length > 0" :changes="changes" :best-year-label="bestYearLabel" />
        <DashboardRetirementSnapshot
          v-if="snapshot"
          v-model:years="snapshotYears"
          :snapshot="snapshot"
          :max-years="snapshotMaxYears"
        />
      </div>

      <div class="mt-8 space-y-6">
        <DashboardSeniorityComparison
          :qualification-scope-options="scopeOptions"
          :compute-comparative="computeComparativeTrajectory"
        />

        <div v-if="retirementWave.length > 0" class="grid grid-cols-1 gap-6 lg:grid-cols-11">
          <UCard class="lg:col-span-6">
            <template #header>
              <h3 class="font-serif text-lg font-semibold text-highlighted">Retirement Wave{{ scopeSuffix }}</h3>
            </template>
            <AnalyticsRetirementWaveChart
              :wave-buckets="retirementWave"
              :trajectory-points="wavePoints"
              :qualification-scope="scopeSuffix"
            />
          </UCard>
          <UCard class="lg:col-span-5">
            <template #header>
              <h3 class="font-serif text-lg font-semibold text-highlighted">Percentile Threshold{{ scopeSuffix }}</h3>
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

        <DashboardRetirementComparison
          :qualification-scope-options="scopeOptions"
          :compute-projection="computeRetirementProjection"
        />
      </div>

      <section class="mt-8" aria-labelledby="project-forward-heading">
        <h3 id="project-forward-heading" class="font-serif text-lg font-semibold text-highlighted">Seniority Position by Qual</h3>
        <p data-testid="position-roster-size" class="mt-1 font-mono text-xs text-muted">{{ rosterSummaryLabel ?? '--' }}</p>

        <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-default py-3">
          <div data-testid="project-forward" class="flex items-center gap-2">
            <AppSwitch v-model="projectForward" :disabled="!canProjectForward" aria-label="Project forward" />
            <span class="text-sm text-muted">Project forward</span>
          </div>
          <template v-if="projectForward">
            <USlider v-model="yearsInput" :min="1" :max="sliderMax" :step="1" aria-label="Years to project" class="w-48" />
            <span class="font-mono text-sm font-semibold text-highlighted">{{ yearsLabel }}</span>
          </template>
          <span v-if="!canProjectForward" class="text-sm text-muted">Add a retirement date to project forward.</span>
          <span v-else class="ml-auto font-mono text-xs text-muted">{{ asOfLabel }}</span>
        </div>

        <div class="mt-4">
          <AnalyticsQualSeniorityScale v-if="qualificationPositions.length > 0" :positions="qualificationPositions" />
          <p v-else-if="qualificationPositionsNoResultLabel" data-testid="no-result" class="text-sm text-muted">
            {{ qualificationPositionsNoResultLabel }}
          </p>
        </div>
        <p v-if="hasProjection" class="mt-2 text-xs text-muted">Faded markers show your position today.</p>

        <UCollapsible class="mt-4 flex flex-col gap-2">
          <UButton label="About this view" color="neutral" variant="ghost" size="sm" trailing-icon="i-lucide-chevron-down" class="w-fit text-muted" />
          <template #content>
            <div class="space-y-2 border border-default bg-muted p-4 text-sm text-muted">
              <p>Holdable is a modeled outcome: your projected company Seniority Percentile meets or exceeds the unchanged current Qualification Threshold. This is a projection based on scheduled retirements, not a vacancy. Growth Assumptions also affect your projected percentile.</p>
              <p>Future Qualification occupancy is not projected. Vacancies, bids, transfers, and awards are not modeled. Holdable does not guarantee a position.</p>
              <NuxtLink to="/how-it-works#holdability" class="text-sm underline">Learn more about Holdable and Qualification Thresholds</NuxtLink>
            </div>
          </template>
        </UCollapsible>
      </section>
    </template>
  </div>
</template>
