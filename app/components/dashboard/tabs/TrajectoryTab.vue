<template>
  <div class="p-4 sm:p-6 space-y-6">
    <!-- Section A: Company-wide trajectory (unfiltered) -->

    <!-- Full Trajectory Chart -->
    <DashboardTrajectoryChart
      v-if="userFound"
      :data="trajectoryChartData"
    >
      <template v-if="growthConfig.enabled" #badge>
        <UBadge color="primary" variant="subtle" size="xs" class="ml-2">
          {{ (growthConfig.annualRate * 100).toFixed(1) }}% annual growth
        </UBadge>
      </template>
    </DashboardTrajectoryChart>

    <!-- Seniority Comparison (dual-scope trajectory lines) -->
    <DashboardSeniorityComparison
      v-if="userFound"
      :quals="quals"
      :compute-comparative="computeComparativeTrajectory"
      :user-base="rankCard.base"
      :user-seat="rankCard.seat"
      :user-fleet="rankCard.fleet"
    />

    <!-- Section B: Retirement & qual-filtered analysis -->

    <AnalyticsQualFilterBar :demographics="demographics" />

    <AnalyticsAssumptionsBanner
      :is-banner-dismissed="projections.isBannerDismissed.value"
      @dismiss="projections.dismissBanner()"
    />

    <!-- Retirement Wave + Percentile Threshold -->
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

    <!-- Section C: Rate of change -->

    <!-- Trajectory Rate of Change (qual-filtered) -->
    <UCard v-if="qualTrajectoryDeltas.length > 0">
      <template #header>
        <h3 class="font-semibold">Seniority Improvement Rate</h3>
      </template>
      <AnalyticsTrajectoryRateOfChange :deltas="qualTrajectoryDeltas" selected-qual="" />
    </UCard>

    <!-- Improvement Rate Sparkline (company-wide) -->
    <DashboardTrajectoryDeltaSparkline
      v-if="userFound && companyTrajectoryDeltas.length > 0"
      :deltas="companyTrajectoryDeltas"
    />
  </div>
</template>

<script setup lang="ts">
import { useQualDemographics } from '~/composables/useQualDemographics'
import { useQualProjections } from '~/composables/useQualProjections'
import { useUserTrajectory } from '~/composables/useUserTrajectory'
import { useDashboardStats } from '~/composables/useDashboardStats'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number)

const {
  userFound, rankCard, trajectoryChartData,
  trajectoryDeltas: companyTrajectoryDeltas,
  computeComparativeTrajectory, quals,
} = useDashboardStats()

const demographics = useQualDemographics()
const projections = useQualProjections(demographics.qualFilterFn)
const qualTrajectoryDeltas = projections.trajectoryDeltas
const { growthConfig } = projections

const { computeRetirementProjection } = useUserTrajectory()
</script>
