<script setup lang="ts">
import { useNextProjections } from '~/composables/seniority'

// Trajectory › Retirements: the Retirement Wave with an N-year count with the trajectory over it,
// and Retirement Projections across Qualification Scopes.
defineProps<{
  loading: boolean
  hasData: boolean
  userFound: boolean
}>()

const { computeRetirementProjection, scopeOptions } = useNextProjections()
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
      description="Import a seniority list and enter your employee number to see which retirements move you."
      :actions="[{ label: 'Import a list', icon: 'i-lucide-file-input', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24"
    />

    <div v-else class="space-y-6">
      <DashboardRetirementWaveCard />

      <DashboardRetirementComparison
        :qualification-scope-options="scopeOptions"
        :compute-projection="computeRetirementProjection"
      />
    </div>
  </div>
</template>
