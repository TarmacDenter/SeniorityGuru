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
  <div class="p-4 sm:p-6 space-y-6">
    <AnalyticsQualFilterBar :demographics="demographics" />

    <!-- Row 1: Junior CA table + Qual Composition -->
    <div class="grid grid-cols-5 gap-6">
      <div class="col-span-3">
        <UCard>
          <template #header>
            <h3 class="font-semibold">Most Junior Captain by Qual</h3>
          </template>
          <AnalyticsJuniorCaptainTable
            :rows="demographics.mostJuniorCAs.value"
            :user-seniority-number="userSeniorityNumber"
          />
        </UCard>
      </div>
      <div class="col-span-2 space-y-3 overflow-y-auto max-h-96">
        <AnalyticsQualCompositionCard
          v-for="row in demographics.qualComposition.value"
          :key="row.qualKey"
          :row="row"
        />
      </div>
    </div>

    <!-- Row 2: Age distribution -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">Age Distribution{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
      </template>
      <AnalyticsAgeDistributionChart
        :buckets="demographics.ageDistribution.value.buckets"
        :null-count="demographics.ageDistribution.value.nullCount"
      />
    </UCard>

    <!-- Row 3: YOS breakdown -->
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
