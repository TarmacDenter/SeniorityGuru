<script setup lang="ts">
import { useSeniorityCore, useQualAnalytics } from '~/composables/seniority'
import { computeYOS } from '~/utils/date'

defineProps<{ loading?: boolean }>()

const { hasData, newHire } = useSeniorityCore()
const demographics = useQualAnalytics()

const userYos = computed(() => {
  const synthetic = newHire.syntheticEntry.value
  if (synthetic) return computeYOS(synthetic.hire_date)
  const entry = demographics.userEntry.value
  if (entry) return computeYOS(entry.hire_date)
  return undefined
})

const userSeniorityNumber = computed(() =>
  newHire.syntheticEntry.value?.seniority_number
  ?? demographics.userEntry.value?.seniority_number,
)

const ready = useDeferredReady()
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-10 w-64" />
      <USkeleton class="h-48" />
      <USkeleton class="h-32" />
      <USkeleton class="h-64" />
    </div>

    <!-- Empty state: no seniority data -->
    <UEmpty
      v-else-if="!hasData"
      icon="i-lucide-users"
      title="No Seniority Data Yet"
      description="Upload your airline's seniority list to explore demographics, age distribution, and qual composition."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24"
    />

    <template v-else>
    <AnalyticsQualFilterBar :demographics="demographics" />

    <!-- Most Junior Captain by Qual — full width, own row -->
    <USkeleton v-if="!ready || !demographics.mostJuniorCAs.value.length" class="h-48 rounded-lg" />
    <UCard v-else>
      <template #header>
        <h3 class="font-semibold">Most Junior Captain by Qual</h3>
      </template>
      <AnalyticsJuniorCaptainTable
        :rows="demographics.mostJuniorCAs.value"
        :user-seniority-number="userSeniorityNumber"
      />
    </UCard>

    <!-- Base / Fleet / Seat Sizes — own row -->
    <USkeleton v-if="!ready || !demographics.qualComposition.value.length" class="h-32 rounded-lg" />
    <AnalyticsQualSizesCard v-else :composition="demographics.qualComposition.value" />

    <!-- Qual Composition list — full width, own row -->
    <USkeleton v-if="!ready || !demographics.qualComposition.value.length" class="h-64 rounded-lg" />
    <UCard v-else>
      <template #header>
        <h3 class="font-semibold">Qual Composition</h3>
      </template>
      <div class="space-y-2">
        <AnalyticsQualCompositionCard
          v-for="row in demographics.qualComposition.value"
          :key="row.qualKey"
          :row="row"
        />
      </div>
    </UCard>

    <!-- Age distribution -->
    <USkeleton v-if="!ready || !demographics.ageDistribution.value.buckets.length" class="h-64 rounded-lg" />
    <UCard v-else>
      <template #header>
        <h3 class="font-semibold">Age Distribution{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
      </template>
      <AnalyticsAgeDistributionChart
        :buckets="demographics.ageDistribution.value.buckets"
        :null-count="demographics.ageDistribution.value.nullCount"
      />
    </UCard>

    <!-- YOS breakdown -->
    <USkeleton v-if="!ready || !demographics.yosHistogram.value.length" class="h-48 rounded-lg" />
    <UCard v-else>
      <template #header>
        <h3 class="font-semibold">Years of Service{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
      </template>
      <AnalyticsYearsOfServiceBreakdown
        :distribution="demographics.yosDistribution.value"
        :histogram="demographics.yosHistogram.value"
        :user-yos="userYos"
      />
    </UCard>
    </template>
  </div>
</template>
