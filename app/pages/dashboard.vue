<script setup lang="ts">
import { useSeniorityStore } from '~/stores/seniority';
import { useUserStore } from '~/stores/user';
import { useSeniorityCore, useStanding } from '~/composables/seniority';
import { useDashboardTabs } from '~/composables/useDashboardTabs';
import { DEFAULT_TAB } from '~/utils/dashboard-tabs';

definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();

const { activeTab, tabs } = useDashboardTabs();

watch(activeTab, (tab) => {
  const query: Record<string, string> = {};
  if (tab !== DEFAULT_TAB) query.tab = tab;
  if (selectedListId.value) query.list = String(selectedListId.value);
  navigateTo({ path: '/dashboard', query }, { replace: true });
});

const seniorityStore = useSeniorityStore();
const userStore = useUserStore();
const loading = ref(true);

// Initialize synchronously from the URL so the watcher never sees this as a
// "change" — the watcher is lazy by default and won't fire on the initial value.
const selectedListId = ref<number | undefined>(
  route.query.list ? Number(route.query.list) : undefined,
);

const listOptions = computed(() =>
  seniorityStore.lists.map((l, i) => ({
    id: l.id,
    label: l.title ? `${l.title} (${l.effectiveDate})` : l.effectiveDate,
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
  return `${base} · effective ${list.effectiveDate}`;
});

const { hasData, hasAnchor: userFound, isNewHireMode, newHire, lens } = useSeniorityCore();
const hasEmployeeNumber = computed(() => !!userStore.employeeNumber || !!newHire.syntheticEntry.value);
const { rankCard, statCards: stats, retirementSnapshot, baseStatus: baseStatusData } = useStanding();
const trajectoryResult = computed(() => lens.value?.trajectory() ?? null);
const trajectoryChartData = computed(() =>
  trajectoryResult.value?.chartData ?? { labels: [] as string[], data: [] as number[] },
);
const trajectoryDeltas = computed(() => trajectoryResult.value?.deltas ?? []);

// Watcher fires ONLY for user-initiated dropdown changes after mount.
// When onMounted sets the default value, oldId is undefined → guard skips it.
watch(selectedListId, async (id, oldId) => {
  if (!id || !oldId) return;
  loading.value = true;
  await seniorityStore.fetchEntries(id);
  const query: Record<string, string> = { list: String(id) };
  if (activeTab.value !== DEFAULT_TAB) query.tab = activeTab.value;
  await navigateTo({ path: '/dashboard', query }, { replace: true });
  loading.value = false;
});

onMounted(async () => {
  await userStore.loadPreferences();
  await seniorityStore.fetchLists();

  // Set a default if the URL had no ?list= param.
  // This fires the watcher but oldId=undefined → the guard catches it.
  if (!selectedListId.value) {
    selectedListId.value = seniorityStore.lists[0]?.id ?? undefined;
  }

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

      <UDashboardToolbar class="hidden sm:flex">
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

      <!-- Mobile-only: tab bar and list selector (desktop uses UDashboardToolbar above) -->
      <div class="sm:hidden overflow-x-auto border-b border-(--ui-border)">
        <UTabs v-model="activeTab" :items="tabs" :content="false" variant="link" size="sm" class="min-w-max px-2" />
      </div>
      <div v-if="listOptions.length > 1" class="sm:hidden flex items-center gap-2 px-3 py-1.5 border-b border-(--ui-border)">
        <USelectMenu
          v-model="selectedListId"
          :items="listOptions"
          value-key="id"
          label-key="label"
          placeholder="Select list..."
          size="sm"
          class="flex-1"
        />
        <UBadge v-if="isHistorical" color="warning" variant="subtle" size="sm">
          <UIcon name="i-lucide-alert-triangle" class="size-3 mr-1" />
          Historical
        </UBadge>
      </div>
    </template>

    <template #body>
      <!-- Empty state: no lists imported yet -->
      <div
        v-if="!loading && seniorityStore.lists.length === 0"
        class="flex flex-col items-center justify-center h-full gap-6 py-24 text-center px-4"
      >
        <UIcon name="i-lucide-upload-cloud" class="size-16 text-muted" />
        <div class="space-y-2">
          <h2 class="text-xl font-semibold">No seniority list yet</h2>
          <p class="text-muted max-w-sm">
            Import your airline's seniority list to see your rank, trajectory, and retirement projections.
          </p>
        </div>
        <div class="flex gap-3 flex-wrap justify-center">
          <UButton to="/seniority/upload" icon="i-lucide-upload" size="lg">
            Import a list
          </UButton>
          <UButton to="/settings" variant="ghost" icon="i-lucide-settings" size="lg">
            Set up your profile
          </UButton>
        </div>
        <p class="text-xs text-muted">
          Your data stays on this device — no account needed.
        </p>
      </div>

      <!-- My Status tab (quick hits) -->
      <DashboardTabsMyStatusTab
        v-else-if="activeTab === 'status'"
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
      <DashboardTabsDemographicsTab v-else-if="activeTab === 'demographics'" :loading="loading" />

      <!-- Position tab -->
      <DashboardTabsPositionTab v-else-if="activeTab === 'position'" :loading="loading" />

      <!-- Trajectory tab -->
      <DashboardTabsTrajectoryTab v-else-if="activeTab === 'trajectory'" :loading="loading" />

      <!-- Seniority List tab — fills panel body, manages its own scroll -->
      <DashboardTabsSeniorityListTab v-else-if="activeTab === 'seniority'" :loading="loading" />

      <!-- Retirements tab -->
      <DashboardTabsRetirementsTab v-else-if="activeTab === 'retirements'" />

      <div v-else />
    </template>
  </UDashboardPanel>
</template>
