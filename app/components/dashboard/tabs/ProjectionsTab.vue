<template>
  <div class="p-4 sm:p-6 space-y-6">
    <!-- Full Trajectory Chart -->
    <DashboardTrajectoryChart
      v-if="userFound"
      :data="trajectoryChartData"
    />

    <!-- Seniority Comparison (dual-scope trajectory lines) -->
    <DashboardSeniorityComparison
      v-if="userFound"
      :quals="quals"
      :compute-comparative="computeComparativeTrajectory"
      :user-base="rankCard.base"
      :user-seat="rankCard.seat"
      :user-fleet="rankCard.fleet"
    />

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
import { useQualProjections } from '~/composables/useQualProjections'
import { useDashboardStats } from '~/composables/useDashboardStats'

const {
  userFound, rankCard, trajectoryChartData,
  trajectoryDeltas: companyTrajectoryDeltas,
  computeComparativeTrajectory, quals,
} = useDashboardStats()

const projections = useQualProjections()
const qualTrajectoryDeltas = projections.trajectoryDeltas
</script>
