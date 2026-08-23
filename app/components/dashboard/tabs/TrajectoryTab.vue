<script setup lang="ts">
import { useSeniorityCore, useQualFilter, useStanding, useTrajectory } from '~/composables/seniority'
import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, createSeniorityScenario, presentPercentileCrossing, presentSeniorityTrajectory, type GrowthAssumptions } from '~/utils/seniority'

defineProps<{ loading?: boolean }>()

const { hasData, hasAnchor, entries, lens, anchoredLens, projectionEndDate } = useSeniorityCore()

const growthAssumptions = ref<GrowthAssumptions>({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS })

const { rankCard } = useStanding()

const {
  chartData: trajectoryChartData,
  computeComparativeTrajectory,
  computeRetirementProjection,
} = useTrajectory(growthAssumptions)

const qualFilter = useQualFilter()
const scopedScenario = computed(() => createSeniorityScenario({
  growthAssumptions: growthAssumptions.value,
  qualificationScope: qualFilter.qualificationScope.value,
}))
const retirementWave = computed(() => lens.value?.retirementYearAnalysis(scopedScenario.value) ?? [])
const waveTrajectoryResult = computed(() => projectionEndDate.value
  ? anchoredLens.value?.seniorityTrajectory({ through: projectionEndDate.value, scenario: scopedScenario.value }) ?? null
  : null)
const waveTrajectory = computed(() => waveTrajectoryResult.value?.points ?? [])
const qualificationTrajectoryChanges = computed(() => waveTrajectoryResult.value
  ? presentSeniorityTrajectory(waveTrajectoryResult.value).changes
  : [])
const targetPercentile = ref(50)
const targetPercentileMin = computed(() => waveTrajectory.value[0]?.percentile ?? 0)
const targetPercentileMax = computed(() => {
  const startingPercentile = targetPercentileMin.value
  const retirementPercentile = waveTrajectory.value.at(-1)?.percentile ?? startingPercentile
  return Math.max(startingPercentile, retirementPercentile)
})

watch([targetPercentileMin, targetPercentileMax], ([min, max]) => {
  targetPercentile.value = Math.min(Math.max(targetPercentile.value, min), max)
}, { immediate: true })

const thresholdResult = computed(() => presentPercentileCrossing(projectionEndDate.value
  ? anchoredLens.value?.percentileCrossing({
    targetPercentile: targetPercentile.value,
    through: projectionEndDate.value,
    scenario: scopedScenario.value,
  }) ?? null
  : null))
const bannerKey = 'qual-projections-banner-dismissed'
const isBannerDismissed = ref(typeof localStorage !== 'undefined' && localStorage.getItem(bannerKey) === 'true')

function dismissBanner() {
  isBannerDismissed.value = true
  if (typeof localStorage !== 'undefined') localStorage.setItem(bannerKey, 'true')
}

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
    <DashboardGrowthBar v-model="growthAssumptions" />

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
        <template v-if="growthAssumptions.enabled" #badge>
          <UBadge color="primary" variant="subtle" size="xs" class="ml-2">
            {{ (growthAssumptions.annualGrowthRate * 100).toFixed(1) }}% annual growth
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

      <AnalyticsQualFilterBar
        :fleet="qualFilter.selectedFleet.value"
        :seat="qualFilter.selectedSeat.value"
        :base="qualFilter.selectedBase.value"
        :fleets="qualFilter.availableFleets.value"
        :seats="qualFilter.availableSeats.value"
        :bases="qualFilter.availableBases.value"
        @update:fleet="qualFilter.selectedFleet.value = $event"
        @update:seat="qualFilter.selectedSeat.value = $event"
        @update:base="qualFilter.selectedBase.value = $event"
      />

      <AnalyticsAssumptionsBanner
        :is-banner-dismissed="isBannerDismissed"
        context="trajectory"
        @dismiss="dismissBanner"
      />

      <!-- Retirement Wave + Percentile Threshold -->
      <div v-if="!ready || !retirementWave.length" class="grid grid-cols-1 sm:grid-cols-11 gap-6">
        <USkeleton class="sm:col-span-6 h-64 rounded-lg" />
        <USkeleton class="sm:col-span-5 h-64 rounded-lg" />
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-11 gap-6">
        <div class="sm:col-span-6">
          <UCard >
            <template #header>
              <h3 class="font-semibold">Retirement Wave{{ qualFilter.qualificationLabel.value ? ` — ${qualFilter.qualificationLabel.value}` : '' }}</h3>
            </template>
            <AnalyticsRetirementWaveChart
              :wave-buckets="retirementWave"
              :trajectory-points="waveTrajectory"
              :qualification-scope="qualFilter.qualificationLabel.value"
            />
          </UCard>
        </div>
        <div class="sm:col-span-5">
          <UCard >
            <template #header>
              <h3 class="font-semibold">Percentile Threshold{{ qualFilter.qualificationLabel.value ? ` — ${qualFilter.qualificationLabel.value}` : '' }}</h3>
            </template>
            <AnalyticsPercentileThresholdCalculator
              :result="thresholdResult"
              :target-percentile="targetPercentile"
              :min-percentile="targetPercentileMin"
              :max-percentile="targetPercentileMax"
              :has-employee-number="hasAnchor"
              @percentile-change="targetPercentile = $event"
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
      <UCard v-if="qualificationTrajectoryChanges.length > 0">
        <template #header>
          <h3 class="font-semibold">Seniority Improvement Rate</h3>
        </template>
        <AnalyticsTrajectoryRateOfChange :changes="qualificationTrajectoryChanges" qualification-scope="" />
      </UCard>

    </div>
    </template>
  </div>
</template>
