<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Dashboard" />
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6">
        <!-- Hero: Seniority Rank -->
        <SeniorityRankCard :rank="rankCard" />

        <!-- Stats Grid -->
        <DashboardStatsGrid :stats="stats" />

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <RetirementProjectionChart :data="retirementChartData" />
          </div>
          <BaseSeatBreakdown :data="baseSeatData" />
        </div>

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <AggregateStatsGrid :data="aggregateStats" />
          </div>
          <RecentListsTimeline :lists="recentLists" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'seniority'
})

const { stats, rankCard, retirementChartData, baseSeatData, recentLists, aggregateStats } = useDashboardPlaceholders()
</script>
