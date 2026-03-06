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
        <DashboardSeniorityRankCard :rank="rankCard" />
        <DashboardStatsGrid :stats="stats" />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <DashboardRetirementProjectionChart :data="retirementChartData" />
          </div>
          <DashboardBaseSeatBreakdown :data="baseSeatData" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <DashboardAggregateStatsGrid :data="aggregateStats" />
          </div>
          <DashboardRecentListsTimeline :lists="recentLists" />
        </div>
      </div>

      <!-- Seniority List tab -->
      <SeniorityListViewer v-else-if="activeTab === 'seniority'" :loading="seniorityLoading" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import { useSeniorityStore } from '~/stores/seniority';
import { useUserStore } from '~/stores/user';

definePageMeta({
  middleware: 'auth',
  layout: 'seniority'
})

const route = useRoute();

const tabs: TabsItem[] = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', value: 'overview' },
  { label: 'Seniority List', icon: 'i-lucide-list-ordered', value: 'seniority' },
];

const activeTab = ref((route.query.tab as string) || 'overview');

watch(activeTab, (tab) => {
  navigateTo({ path: '/', query: tab === 'overview' ? {} : { tab } }, { replace: true });
});

const { stats, rankCard, retirementChartData, baseSeatData, recentLists, aggregateStats } = useDashboardPlaceholders()

const seniorityStore = useSeniorityStore();
const userStore = useUserStore();
const seniorityLoading = ref(true);

onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchProfile();
  }

  await seniorityStore.fetchLists();

  const latestList = seniorityStore.lists[0] ?? null;
  if (latestList) {
    await seniorityStore.fetchEntries(latestList.id);
  }

  seniorityLoading.value = false;
});
</script>
