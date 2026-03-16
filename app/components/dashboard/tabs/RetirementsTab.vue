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
      :quals="quals"
      :compute-projection="computeRetirementProjection"
    />
  </div>
</template>

<script setup lang="ts">
import { useQualDemographics } from '~/composables/useQualDemographics'
import { useQualProjections } from '~/composables/useQualProjections'
import { useUserTrajectory } from '~/composables/useUserTrajectory'
import { useCompanyStats } from '~/composables/useCompanyStats'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const demographics = useQualDemographics()
const projections = useQualProjections(demographics.qualFilterFn)
const { computeRetirementProjection } = useUserTrajectory()
const { quals } = useCompanyStats()

const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number)

</script>
