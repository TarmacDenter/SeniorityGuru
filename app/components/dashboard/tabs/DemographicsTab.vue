<script setup lang="ts">
import { useQualDemographics } from '~/composables/useQualDemographics'
import { useNewHireMode } from '~/composables/useNewHireMode'
import { computeYOS } from '#shared/utils/qual-analytics'

const demographics = useQualDemographics()
const newHireMode = useNewHireMode()

const userYos = computed(() => {
  const synthetic = newHireMode.syntheticEntry.value
  if (synthetic) return computeYOS(synthetic.hire_date)
  const entry = demographics.userEntry.value
  if (entry) return computeYOS(entry.hire_date)
  return undefined
})

const userSeniorityNumber = computed(() =>
  newHireMode.syntheticEntry.value?.seniority_number
  ?? demographics.userEntry.value?.seniority_number,
)
</script>

<template>
  <div class="sm:p-6 space-y-6">
    <div class="px-4 pt-4 sm:px-0 sm:pt-0">
      <AnalyticsQualFilterBar :demographics="demographics" />
    </div>

    <!-- Most Junior Captain by Qual — full width, own row -->
    <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-5' }">
      <template #header>
        <h3 class="font-semibold">Most Junior Captain by Qual</h3>
      </template>
      <AnalyticsJuniorCaptainTable
        :rows="demographics.mostJuniorCAs.value"
        :user-seniority-number="userSeniorityNumber"
      />
    </UCard>

    <!-- Base / Fleet / Seat Sizes — own row -->
    <AnalyticsQualSizesCard :composition="demographics.qualComposition.value" />

    <!-- Qual Composition list — full width, own row -->
    <UCard>
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
    <UCard>
      <template #header>
        <h3 class="font-semibold">Age Distribution{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
      </template>
      <AnalyticsAgeDistributionChart
        :buckets="demographics.ageDistribution.value.buckets"
        :null-count="demographics.ageDistribution.value.nullCount"
      />
    </UCard>

    <!-- YOS breakdown -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">Years of Service{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
      </template>
      <AnalyticsYearsOfServiceBreakdown
        :distribution="demographics.yosDistribution.value"
        :histogram="demographics.yosHistogram.value"
        :user-yos="userYos"
      />
    </UCard>
  </div>
</template>
