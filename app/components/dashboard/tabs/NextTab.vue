<script setup lang="ts">
import type { PresentedTrajectoryChange } from '~/utils/seniority'

// The Next panel: one trajectory chart and the key changes along it.
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
</script>

<template>
  <div class="px-4 sm:px-6 py-4 sm:py-6 max-w-3xl">
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
    </template>
  </div>
</template>
