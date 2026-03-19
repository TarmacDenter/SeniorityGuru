<script setup lang="ts">
import { useQualDemographics } from '~/composables/useQualDemographics'
import { useQualProjections } from '~/composables/useQualProjections'
import { useUserTrajectory } from '~/composables/useUserTrajectory'
import { useNewHireMode } from '~/composables/useNewHireMode'
import { useUserStore } from '~/stores/user'
import { useSeniorityStore } from '~/stores/seniority'

const userStore = useUserStore()
const seniorityStore = useSeniorityStore()
const newHireMode = useNewHireMode()
const demographics = useQualDemographics()
const projections = useQualProjections(demographics.qualSpec)
const { computeRetirementProjection } = useUserTrajectory()
const entries = computed(() => seniorityStore.entries)

const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number || !!newHireMode.syntheticEntry.value)

</script>

<template>
  <div class="p-4 sm:p-6 space-y-6">
    <AnalyticsQualFilterBar :demographics="demographics" />

    <AnalyticsAssumptionsBanner
      :is-banner-dismissed="projections.isBannerDismissed.value"
      @dismiss="projections.dismissBanner()"
    />

    <!-- Row 1: Retirement Wave + Percentile Threshold -->
    <div class="grid grid-cols-11 gap-6">
      <div class="col-span-6">
        <UCard>
          <template #header>
            <h3 class="font-semibold">Retirement Wave{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
          </template>
          <AnalyticsRetirementWaveChart
            :wave-buckets="projections.retirementWave.value"
            :trajectory-points="projections.waveTrajectory.value"
            :selected-qual="demographics.qualLabel.value"
          />
        </UCard>
      </div>
      <div class="col-span-5">
        <UCard>
          <template #header>
            <h3 class="font-semibold">Percentile Threshold{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
          </template>
          <AnalyticsPercentileThresholdCalculator
            :result="projections.thresholdResult.value"
            :target-percentile="projections.targetPercentile.value"
            :selected-qual="demographics.qualLabel.value"
            :has-employee-number="hasEmployeeNumber"
            @percentile-change="projections.targetPercentile.value = $event"
          />
        </UCard>
      </div>
    </div>

    <!-- Retirement Comparison (dual-scope) -->
    <DashboardRetirementComparison
      :entries="entries"
      :compute-projection="computeRetirementProjection"
    />
  </div>
</template>
