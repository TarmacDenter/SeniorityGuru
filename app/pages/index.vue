<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Dashboard" />

      <UDashboardToolbar>
        <UTabs v-model="activeTab" :items="tabs" :content="false" variant="link" />

        <template #right>
          <div class="flex items-center gap-2">
            <USelectMenu v-model="selectedListId" :items="listOptions" value-key="id"
              label-key="label" placeholder="Select list..." class="w-48" size="sm" />
            <UBadge v-if="isHistorical" color="warning" variant="subtle" size="sm">
              <UIcon name="i-lucide-alert-triangle" class="size-3 mr-1" />
              Historical
            </UBadge>
          </div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="p-4 sm:p-6">
        <!-- Loading state — bento skeleton -->
        <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 py-6">
          <USkeleton class="h-32 lg:[grid-column:1/-1]" />
          <USkeleton v-for="i in 4" :key="i" class="h-24" />
          <USkeleton class="lg:[grid-column:1/3] lg:[grid-row:span_2] h-[320px]" />
          <USkeleton class="lg:[grid-column:3/5] lg:[grid-row:span_2] h-[320px]" />
          <USkeleton class="lg:[grid-column:1/3] h-[280px]" />
          <USkeleton class="lg:[grid-column:3/5] h-[280px]" />
        </div>

        <!-- Empty: no seniority list -->
        <UEmpty v-else-if="!hasData" icon="i-lucide-list-ordered" title="No Seniority Data Yet"
          description="Upload your airline's seniority list to see your position, track retirements, and project your trajectory."
          :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
          class="py-24" />

        <!-- Has data — bento grid -->
        <template v-else>
          <!-- Banners (outside bento grid) -->
          <DashboardEmployeeNumberBanner v-if="!hasEmployeeNumber" class="mb-4 lg:mb-6" />
          <UAlert v-else-if="!userFound" icon="i-lucide-alert-triangle" color="warning" variant="subtle"
            title="Employee Number Not Found"
            :description="`Employee number '${userStore.profile?.employee_number}' was not found in the current seniority list. Aggregate data is shown below.`"
            class="mb-4 lg:mb-6" />

          <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            <!-- Rank card -->
            <DashboardSeniorityRankCard v-if="userFound" :rank="rankCard"
              class="lg:[grid-column:1/-1] dashboard-enter" />

            <!-- Stat cards -->
            <DashboardStatCard v-for="(stat, i) in stats" :key="stat.label" v-bind="stat" class="dashboard-enter"
              :style="{ animationDelay: `${i * 40 + 80}ms` }" />

            <!-- Charts & projections -->
            <template v-if="userFound">
              <DashboardTrajectoryChart :data="trajectoryData"
                class="lg:[grid-column:1/3] lg:[grid-row:span_2] dashboard-enter" style="animation-delay: 260ms" />
              <DashboardRetirementComparison :quals="quals" :compute-projection="computeRetirementProjection"
                class="lg:[grid-column:3/5] lg:[grid-row:span_2] dashboard-enter" style="animation-delay: 300ms" />
              <DashboardSeniorityComparison :quals="quals" :compute-comparative="computeComparativeTrajectory"
                :user-base="rankCard.base" :user-seat="rankCard.seat" :user-fleet="rankCard.fleet"
                class="lg:[grid-column:1/-1] dashboard-enter" style="animation-delay: 340ms" />
            </template>

            <!-- No user: retirement comparison full width -->
            <DashboardRetirementComparison v-if="!userFound" :quals="quals"
              :compute-projection="computeRetirementProjection" class="lg:[grid-column:1/-1] dashboard-enter"
              style="animation-delay: 260ms" />

            <!-- Table data at bottom -->
            <DashboardBaseStatusTable v-if="userFound" :data="baseStatusData"
              class="md:[grid-column:1/3] dashboard-enter" style="animation-delay: 380ms" />
            <DashboardAggregateStatsGrid :data="aggregateStats" class="md:[grid-column:3/-1] dashboard-enter"
              :style="{ animationDelay: userFound ? '420ms' : '300ms' }" />

          </div>
        </template>
      </div>

      <!-- Seniority List tab — fills panel body, manages its own scroll -->
      <SeniorityListViewer v-else-if="activeTab === 'seniority'" :loading="loading" class="h-full" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import { useSeniorityStore } from '~/stores/seniority';
import { useUserStore } from '~/stores/user';
import { useDashboardStats } from '~/composables/useDashboardStats';

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
});

const route = useRoute();

const tabs: TabsItem[] = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', value: 'overview' },
  { label: 'Seniority List', icon: 'i-lucide-list-ordered', value: 'seniority' },
];

const activeTab = ref((route.query.tab as string) || 'overview');

watch(activeTab, (tab) => {
  const query: Record<string, string> = {};
  if (tab !== 'overview') query.tab = tab;
  if (selectedListId.value) query.list = selectedListId.value;
  navigateTo({ path: '/', query }, { replace: true });
});

const seniorityStore = useSeniorityStore();
const userStore = useUserStore();
const loading = ref(true);
const selectedListId = ref<string | undefined>(undefined);

const listOptions = computed(() =>
  seniorityStore.lists.map((l, i) => ({
    id: l.id,
    label: l.title ? `${l.title} (${l.effective_date})` : l.effective_date,
    isLatest: i === 0,
  })),
);

const isHistorical = computed(() => {
  if (!selectedListId.value || listOptions.value.length === 0) return false;
  return selectedListId.value !== listOptions.value[0]?.id;
});

const {
  hasData, hasEmployeeNumber, userFound,
  rankCard, stats, baseStatusData,
  trajectoryData, computeRetirementProjection, computeComparativeTrajectory,
  aggregateStats, quals,
} = useDashboardStats();

watch(selectedListId, async (id) => {
  if (!id || id === seniorityStore.currentListId) return;
  loading.value = true;
  await seniorityStore.fetchEntries(id);
  const query: Record<string, string> = { list: id };
  if (activeTab.value !== 'overview') query.tab = activeTab.value;
  navigateTo({ path: '/', query }, { replace: true });
  loading.value = false;
});

onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchProfile();
  }

  await seniorityStore.fetchLists();

  const listFromQuery = route.query.list as string | undefined;
  const validList = listFromQuery && seniorityStore.lists.some(l => l.id === listFromQuery);
  selectedListId.value = validList ? listFromQuery : (seniorityStore.lists[0]?.id ?? undefined);

  if (selectedListId.value) {
    await seniorityStore.fetchEntries(selectedListId.value);
  }

  loading.value = false;
});
</script>
