<script setup lang="ts">
import { useSeniorityStore } from '~/stores/seniority';
import { useUserStore } from '~/stores/user';
import { useDashboardStats } from '~/composables/useDashboardStats';
import { useDashboardTabs } from '~/composables/useDashboardTabs';
import { DEFAULT_TAB } from '~/utils/dashboard-tabs';

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
});

const route = useRoute();

const { activeTab, tabs } = useDashboardTabs();

watch(activeTab, (tab) => {
  const query: Record<string, string> = {};
  if (tab !== DEFAULT_TAB) query.tab = tab;
  if (selectedListId.value) query.list = selectedListId.value;
  navigateTo({ path: '/dashboard', query }, { replace: true });
});

const seniorityStore = useSeniorityStore();
const userStore = useUserStore();
const loading = ref(true);

// Initialize synchronously from the URL so the watcher never sees this as a
// "change" — the watcher is lazy by default and won't fire on the initial value.
const selectedListId = ref<string | undefined>(
  route.query.list as string | undefined,
);

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

const selectedList = computed(() =>
  seniorityStore.lists.find(l => l.id === selectedListId.value),
);

const navbarDescription = computed(() => {
  const list = selectedList.value;
  if (!list) return undefined;
  const base = list.title ? `${list.title}` : 'Seniority List';
  return `${base} · effective ${list.effective_date}`;
});

const {
  hasData, hasEmployeeNumber, userFound, isNewHireMode,
  rankCard, stats,
  retirementSnapshot, trajectoryDeltas,
  baseStatusData, trajectoryChartData,
} = useDashboardStats();

// Watcher fires ONLY for user-initiated dropdown changes after mount.
// When onMounted sets the default value, oldId is undefined → guard skips it.
watch(selectedListId, async (id, oldId) => {
  if (!id || !oldId) return;
  loading.value = true;
  await seniorityStore.fetchEntries(id);
  const query: Record<string, string> = { list: id };
  if (activeTab.value !== DEFAULT_TAB) query.tab = activeTab.value;
  await navigateTo({ path: '/dashboard', query }, { replace: true });
  loading.value = false;
});

onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchProfile();
  }

  await seniorityStore.fetchLists();

  // Set a default if the URL had no ?list= param.
  // This fires the watcher but oldId=undefined → the guard catches it.
  if (!selectedListId.value) {
    selectedListId.value = seniorityStore.lists[0]?.id ?? undefined;
  }

  // Single authoritative fetch — always runs on mount regardless of URL state.
  if (selectedListId.value) {
    await seniorityStore.fetchEntries(selectedListId.value);
  }

  loading.value = false;
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Dashboard" :description="navbarDescription" />

      <UDashboardToolbar>
        <!-- Hidden on mobile — tabs move to sidebar on small screens -->
        <UTabs v-model="activeTab" :items="tabs" :content="false" variant="link" class="hidden sm:flex" />

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
      <!-- My Status tab (quick hits) -->
      <DashboardTabsMyStatusTab
        v-if="activeTab === 'status'"
        :loading="loading"
        :has-data="hasData"
        :has-employee-number="hasEmployeeNumber"
        :user-found="userFound"
        :is-new-hire-mode="isNewHireMode"
        :rank-card="rankCard"
        :stats="stats"
        :retirement-snapshot="retirementSnapshot"
        :trajectory-deltas="trajectoryDeltas"
        :base-status-data="baseStatusData"
        :trajectory-chart-data="trajectoryChartData"
      />

      <!-- Demographics tab -->
      <DashboardTabsDemographicsTab v-else-if="activeTab === 'demographics'" />

      <!-- Position tab -->
      <DashboardTabsPositionTab v-else-if="activeTab === 'position'" />

      <!-- Trajectory tab -->
      <DashboardTabsTrajectoryTab v-else-if="activeTab === 'trajectory'" />

      <!-- Seniority List tab — fills panel body, manages its own scroll -->
      <DashboardTabsSeniorityListTab v-else-if="activeTab === 'seniority'" :loading="loading" />
    </template>
  </UDashboardPanel>
</template>
