<script setup lang="ts">
import { useQualDemographics } from '~/composables/useQualDemographics'
import { useQualProjections } from '~/composables/useQualProjections'
import { useUserTrajectory } from '~/composables/useUserTrajectory'
import { useDashboardStats } from '~/composables/useDashboardStats'
import { useNewHireMode } from '~/composables/useNewHireMode'
import { useUserStore } from '~/stores/user'
import { useSeniorityStore } from '~/stores/seniority'
import { DEFAULT_GROWTH_CONFIG } from '#shared/types/growth-config'
import type { GrowthConfig } from '#shared/types/growth-config'

const userStore = useUserStore()
const seniorityStore = useSeniorityStore()
const newHireMode = useNewHireMode()
const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number || !!newHireMode.syntheticEntry.value)

const growthConfig = ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG })

const { userFound, rankCard } = useDashboardStats()
const entries = computed(() => seniorityStore.entries)

const {
  trajectoryChartData,
  trajectoryDeltas: companyTrajectoryDeltas,
  computeComparativeTrajectory,
  computeRetirementProjection,
} = useUserTrajectory(growthConfig)

const demographics = useQualDemographics()
const projections = useQualProjections(demographics.qualSpec, growthConfig)
const qualTrajectoryDeltas = projections.trajectoryDeltas
</script>

<template>
  <div class="-m-4 sm:-m-6 flex flex-col h-[calc(100%+2rem)] sm:h-[calc(100%+3rem)]">
    <!-- Growth assumption bar -->
    <DashboardGrowthBar v-model="growthConfig" />

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <!-- About this view collapsible -->
      <UCollapsible class="flex flex-col gap-2">
        <UButton
          label="About this view"
          color="neutral"
          variant="ghost"
          size="sm"
          trailing-icon="i-lucide-chevron-down"
          class="w-fit text-[var(--ui-text-muted)]"
        />
        <template #content>
          <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4 space-y-2 text-sm text-[var(--ui-text-muted)]">
            <p>The trajectory chart projects your seniority percentile over time as pilots ahead of you on the list reach mandatory retirement age.</p>
            <p>Projections are based on scheduled retirements only. New hires, furloughs, and other attrition are not modeled unless a growth assumption is set above.</p>
            <NuxtLink to="/how-it-works" class="text-primary text-sm underline">Full methodology →</NuxtLink>
          </div>
        </template>
      </UCollapsible>

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
        :entries="entries"
        :compute-comparative="computeComparativeTrajectory"
        :user-base="rankCard.base"
        :user-seat="rankCard.seat"
        :user-fleet="rankCard.fleet"
      />

      <!-- Section B: Retirement & qual-filtered analysis -->

      <AnalyticsQualFilterBar :demographics="demographics" />

      <AnalyticsAssumptionsBanner
        :is-banner-dismissed="projections.isBannerDismissed.value"
        context="trajectory"
        @dismiss="projections.dismissBanner()"
      />

      <!-- Retirement Wave + Percentile Threshold -->
      <div class="grid grid-cols-1 sm:grid-cols-11 gap-6">
        <div class="sm:col-span-6">
          <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-5' }">
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
        <div class="sm:col-span-5">
          <UCard :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-5' }">
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
  </div>
</template>
