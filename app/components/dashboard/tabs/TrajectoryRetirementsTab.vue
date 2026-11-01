<script setup lang="ts">
import { useNextProjections } from '~/composables/seniority'

// Trajectory › Retirements: the retirement snapshot, the Retirement Wave with the trajectory over it,
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
  snapshot,
  snapshotYears,
  snapshotMaxYears,
  retirementWave,
  wavePoints,
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
      description="Upload a seniority list and enter your employee number to see which retirements move you."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24"
    />

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-11">
        <UCard v-if="retirementWave.length > 0" class="lg:col-span-6">
          <template #header>
            <h3 class="font-serif text-lg font-semibold text-highlighted">Retirement Wave{{ scopeSuffix }}</h3>
          </template>
          <AnalyticsRetirementWaveChart
            :wave-buckets="retirementWave"
            :trajectory-points="wavePoints"
            :qualification-scope="scopeSuffix"
          />
        </UCard>
        <DashboardRetirementSnapshot
          v-if="snapshot"
          v-model:years="snapshotYears"
          class="lg:col-span-5"
          :snapshot="snapshot"
          :max-years="snapshotMaxYears"
        />
      </div>

      <DashboardRetirementComparison
        :qualification-scope-options="scopeOptions"
        :compute-projection="computeRetirementProjection"
      />
    </div>
  </div>
</template>
