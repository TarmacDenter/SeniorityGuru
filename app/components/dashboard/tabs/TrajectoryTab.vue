<script setup lang="ts">
import { useSeniorityCore, useStanding, useTrajectory, useQualAnalytics } from '~/composables/seniority'
import { DEFAULT_GROWTH_CONFIG } from '~/utils/growth-config'
import type { GrowthConfig } from '~/utils/growth-config'

defineProps<{ loading?: boolean }>()

const { hasData, hasAnchor, newHire, entries } = useSeniorityCore()
const hasEmployeeNumber = computed(() => hasAnchor.value || !!newHire.syntheticEntry.value)

const growthConfig = ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG })

const { rankCard } = useStanding()

const {
  chartData: trajectoryChartData,
  computeComparativeTrajectory,
  computeRetirementProjection,
} = useTrajectory(growthConfig)

const demographics = useQualAnalytics(growthConfig)
const qualTrajectoryDeltas = demographics.trajectoryDeltas

const ready = useDeferredReady()
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Loading skeleton -->
    <div v-if="loading" class="p-3 sm:p-6 space-y-4">
      <USkeleton class="h-10 w-48" />
      <USkeleton class="h-64" />
      <USkeleton class="h-48" />
      <USkeleton class="h-32" />
    </div>

    <!-- Empty state: no seniority data -->
    <UEmpty
      v-else-if="!hasData"
      icon="i-lucide-trending-up"
      title="No Seniority Data Yet"
      description="Upload your airline's seniority list to see your trajectory, retirement projections, and seniority improvement rate."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24 flex-1"
    />

    <template v-else>
    <!-- Growth assumption bar -->
    <DashboardGrowthBar v-model="growthConfig" />

    <!-- Scrollable content -->
    <div class="p-3 sm:p-6 space-y-6 flex-1 overflow-y-auto">
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
      <USkeleton v-if="hasAnchor && (!ready || !trajectoryChartData?.labels?.length)" class="h-64 rounded-lg" />
      <DashboardTrajectoryChart
        v-else-if="hasAnchor"
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
        v-if="hasAnchor"
        :entries="entries"
        :compute-comparative="computeComparativeTrajectory"
        :user-base="rankCard.base"
        :user-seat="rankCard.seat"
        :user-fleet="rankCard.fleet"
      />

      <!-- Section B: Retirement & qual-filtered analysis -->

      <AnalyticsQualFilterBar :demographics="demographics" />

      <AnalyticsAssumptionsBanner
        :is-banner-dismissed="demographics.isBannerDismissed.value"
        context="trajectory"
        @dismiss="demographics.dismissBanner()"
      />

      <!-- Retirement Wave + Percentile Threshold -->
      <div v-if="!ready || !demographics.retirementWave.value.length" class="grid grid-cols-1 sm:grid-cols-11 gap-6">
        <USkeleton class="sm:col-span-6 h-64 rounded-lg" />
        <USkeleton class="sm:col-span-5 h-64 rounded-lg" />
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-11 gap-6">
        <div class="sm:col-span-6">
          <UCard >
            <template #header>
              <h3 class="font-semibold">Retirement Wave{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
            </template>
            <AnalyticsRetirementWaveChart
              :wave-buckets="demographics.retirementWave.value"
              :trajectory-points="demographics.waveTrajectory.value"
              :selected-qual="demographics.qualLabel.value"
            />
          </UCard>
        </div>
        <div class="sm:col-span-5">
          <UCard >
            <template #header>
              <h3 class="font-semibold">Percentile Threshold{{ demographics.qualLabel.value ? ` — ${demographics.qualLabel.value}` : '' }}</h3>
            </template>
            <AnalyticsPercentileThresholdCalculator
              :result="demographics.thresholdResult.value"
              :target-percentile="demographics.targetPercentile.value"
              :selected-qual="demographics.qualLabel.value"
              :has-employee-number="hasEmployeeNumber"
              @percentile-change="demographics.targetPercentile.value = $event"
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

    </div>
    </template>
  </div>
</template>
