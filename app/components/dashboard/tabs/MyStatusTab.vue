<template>
  <div class="p-4 sm:p-6">
    <!-- Loading state — skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 py-6">
      <USkeleton class="h-32 lg:[grid-column:1/-1]" />
      <USkeleton v-for="i in 4" :key="i" class="h-24" />
      <USkeleton class="lg:[grid-column:1/3] h-[280px]" />
      <USkeleton class="lg:[grid-column:3/5] h-[280px]" />
    </div>

    <!-- Empty: no seniority list -->
    <UEmpty v-else-if="!hasData" icon="i-lucide-list-ordered" title="No Seniority Data Yet"
      description="Upload your airline's seniority list to see your position, track retirements, and project your trajectory."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24" />

    <!-- Has data — quick hits grid -->
    <template v-else>
      <!-- Banners (outside grid) -->
      <DashboardEmployeeNumberBanner v-if="!hasEmployeeNumber" class="mb-4 lg:mb-6" />
      <DashboardNewHireModeBanner
        v-else-if="!userFound || isNewHireMode"
        class="mb-4 lg:mb-6"
      />

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <!-- Rank card -->
        <DashboardSeniorityRankCard v-if="userFound" :rank="rankCard"
          class="lg:[grid-column:1/-1] dashboard-enter" />

        <!-- Stat cards -->
        <DashboardStatCard v-for="(stat, i) in stats" :key="stat.label" v-bind="stat" class="dashboard-enter"
          :style="{ animationDelay: `${i * 40 + 80}ms` }" />

        <!-- Quick-hits: sparkline + retirement snapshot -->
        <template v-if="userFound">
          <DashboardTrajectoryDeltaSparkline
            v-if="trajectoryDeltas.length > 0"
            :deltas="trajectoryDeltas"
            class="lg:[grid-column:1/3] dashboard-enter"
            style="animation-delay: 260ms"
          />
          <DashboardRetirementSnapshot v-if="retirementSnapshot" :snapshot="retirementSnapshot"
            class="lg:[grid-column:3/5] lg:[grid-row:span_2] dashboard-enter" style="animation-delay: 280ms" />
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { useDashboardStats } from '~/composables/useDashboardStats'

type DashboardStatsReturn = ReturnType<typeof useDashboardStats>

defineProps<{
  loading: boolean
  hasData: DashboardStatsReturn['hasData']['value']
  hasEmployeeNumber: DashboardStatsReturn['hasEmployeeNumber']['value']
  userFound: DashboardStatsReturn['userFound']['value']
  isNewHireMode: DashboardStatsReturn['isNewHireMode']['value']
  rankCard: DashboardStatsReturn['rankCard']['value']
  stats: DashboardStatsReturn['stats']['value']
  retirementSnapshot: DashboardStatsReturn['retirementSnapshot']['value']
  trajectoryDeltas: DashboardStatsReturn['trajectoryDeltas']['value']
}>()
</script>
