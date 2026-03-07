<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Dashboard" />

      <UDashboardToolbar>
        <UTabs v-model="activeTab" :items="tabs" :content="false" variant="link" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="p-4 sm:p-6 space-y-6">
        <!-- Loading state -->
        <div v-if="loading" class="space-y-4 py-6">
          <USkeleton v-for="i in 4" :key="i" class="h-24 w-full" />
        </div>

        <!-- Empty: no seniority list -->
        <UEmpty
          v-else-if="!hasData"
          icon="i-lucide-list-ordered"
          title="No Seniority Data Yet"
          description="Upload your airline's seniority list to see your position, track retirements, and project your trajectory."
          :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
          class="py-24"
        />

        <!-- Has data -->
        <template v-else>
          <!-- Employee number banner -->
          <DashboardEmployeeNumberBanner v-if="!hasEmployeeNumber" />

          <!-- Employee number set but not found in list -->
          <UAlert
            v-else-if="!userFound"
            icon="i-lucide-alert-triangle"
            color="warning"
            variant="subtle"
            title="Employee Number Not Found"
            :description="`Employee number '${userStore.profile?.employee_number}' was not found in the current seniority list. Aggregate data is shown below.`"
          />

          <!-- Rank card (only when user found) -->
          <DashboardSeniorityRankCard v-if="userFound" :rank="rankCard" />

          <!-- Stats grid (always when data exists) -->
          <DashboardStatsGrid :stats="stats" />

          <!-- Trajectory + Base Status (only when user found) -->
          <div v-if="userFound" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
              <DashboardTrajectoryChart :data="trajectoryData" />
            </div>
            <DashboardBaseStatusTable :data="baseStatusData" />
          </div>

          <!-- Retirement Comparison + Seniority Comparison -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardRetirementComparison
              :quals="quals"
              :compute-projection="computeRetirementProjection"
            />
            <DashboardSeniorityComparison
              v-if="userFound"
              :quals="quals"
              :compute-comparative="computeComparativeTrajectory"
              :user-base="rankCard.base"
              :user-seat="rankCard.seat"
              :user-fleet="rankCard.fleet"
            />
          </div>

          <!-- Aggregate Stats + Recent Lists -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
              <DashboardAggregateStatsGrid :data="aggregateStats" />
            </div>
            <DashboardRecentListsTimeline :lists="recentLists" />
          </div>
        </template>
      </div>

      <!-- Seniority List tab -->
      <SeniorityListViewer v-else-if="activeTab === 'seniority'" :loading="loading" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useDashboardStats } from '~/composables/useDashboardStats'

definePageMeta({
  middleware: 'auth',
  layout: 'seniority',
})

const route = useRoute()

const tabs: TabsItem[] = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', value: 'overview' },
  { label: 'Seniority List', icon: 'i-lucide-list-ordered', value: 'seniority' },
]

const activeTab = ref((route.query.tab as string) || 'overview')

watch(activeTab, (tab) => {
  navigateTo({ path: '/', query: tab === 'overview' ? {} : { tab } }, { replace: true })
})

const seniorityStore = useSeniorityStore()
const userStore = useUserStore()
const loading = ref(true)

const {
  hasData, hasEmployeeNumber, userFound,
  rankCard, stats, baseStatusData,
  trajectoryData, computeRetirementProjection, computeComparativeTrajectory,
  aggregateStats, recentLists, quals,
} = useDashboardStats()

onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchProfile()
  }

  await seniorityStore.fetchLists()

  const latestList = seniorityStore.lists[0] ?? null
  if (latestList) {
    await seniorityStore.fetchEntries(latestList.id)
  }

  loading.value = false
})
</script>
