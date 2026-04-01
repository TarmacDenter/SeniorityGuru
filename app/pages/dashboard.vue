<script setup lang="ts">
import { useSeniorityCore, useStanding, useSeniorityLists } from '~/composables/seniority';
import { useDashboardTabs } from '~/composables/useDashboardTabs';
import { useDemoBanner } from '~/composables/useDemoBanner';
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

const { lists, fetchLists, fetchEntries } = useSeniorityLists();
const { employeeNumber, loadPreferences } = useUser();
const loading = ref(true);

// Initialize synchronously from the URL so the watcher never sees this as a
// "change" — the watcher is lazy by default and won't fire on the initial value.
const selectedListId = ref<number | undefined>(
  route.query.list ? Number(route.query.list) : undefined,
);

const listOptions = computed(() =>
  lists.value.map((l, i) => ({
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
  lists.value.find(l => l.id === selectedListId.value),
);

const navbarDescription = computed(() => {
  const list = selectedList.value;
  if (!list) return undefined;
  const base = list.title ? `${list.title}` : 'Seniority List';
  return `${base} · effective ${list.effectiveDate}`;
});

const { showBadge: showDemoBadge } = useDemoBanner();
const { hasData, hasAnchor: userFound, isNewHireMode, newHire, lens } = useSeniorityCore();
const hasEmployeeNumber = computed(() => !!employeeNumber.value || !!newHire.syntheticEntry.value);
const { rankCard, statCards: stats, retirementSnapshot, baseStatus: baseStatusData } = useStanding();
const trajectoryResult = computed(() => lens.value?.trajectory() ?? null);
const trajectoryChartData = computed(() =>
  trajectoryResult.value?.chartData ?? { labels: [] as string[], data: [] as number[] },
);
const trajectoryDeltas = computed(() => trajectoryResult.value?.deltas ?? []);

// Full-bleed tabs manage their own padding (toolbars/growth bars go edge-to-edge)
const fullBleedTabs = new Set(['position', 'trajectory', 'seniority']);
const panelUi = computed(() => ({
  body: fullBleedTabs.has(activeTab.value)
    ? 'flex flex-col flex-1 sm:overflow-y-auto p-0'
    : undefined,
}));

// Watcher fires ONLY for user-initiated dropdown changes after mount.
// When onMounted sets the default value, oldId is undefined → guard skips it.
watch(selectedListId, async (id, oldId) => {
  if (!id || !oldId) return;
  loading.value = true;
  await fetchEntries(id);
  const query: Record<string, string> = { list: String(id) };
  if (activeTab.value !== DEFAULT_TAB) query.tab = activeTab.value;
  await navigateTo({ path: '/dashboard', query }, { replace: true });
  loading.value = false;
});

onMounted(async () => {
  await loadPreferences();
  await fetchLists();

  // Set a default if the URL had no ?list= param.
  // This fires the watcher but oldId=undefined → the guard catches it.
  if (!selectedListId.value) {
    selectedListId.value = lists.value[0]?.id ?? undefined;
  }

  if (selectedListId.value) {
    await fetchEntries(selectedListId.value);
  }

  loading.value = false;
});
</script>

<template>
  <UDashboardPanel :ui="panelUi">
    <template #header>
      <SeniorityNavbar title="Dashboard" :description="navbarDescription" />

      <UDashboardToolbar class="hidden sm:flex overflow-y-hidden">
        <UTabs v-model="activeTab" :items="tabs" :content="false" variant="link" />
      </UDashboardToolbar>

      <!-- Mobile-only: scrollable tab chip row -->
      <DashboardTabChips v-model="activeTab" :tabs="tabs" />

      <!-- List selector — all breakpoints -->
      <div v-if="lists.length > 0" class="flex items-center gap-2 px-3 py-1.5 border-b border-(--ui-border)">
        <USelectMenu
          v-model="selectedListId"
          :items="listOptions"
          value-key="id"
          label-key="label"
          placeholder="Select list..."
          size="sm"
          class="flex-1 sm:flex-none sm:w-56"
        />
        <UBadge v-if="selectedList?.isDemo && showDemoBadge" color="info" variant="subtle" size="sm">
          <UIcon name="i-lucide-flask-conical" class="size-3 mr-1" />
          Demo
        </UBadge>
        <UBadge v-if="isHistorical" color="warning" variant="subtle" size="sm">
          <UIcon name="i-lucide-alert-triangle" class="size-3 mr-1" />
          Historical
        </UBadge>
      </div>
    </template>

    <template #body>
      <DashboardInstallBanner />
      <DashboardDemoBanner />

      <!-- Empty state: no lists imported yet -->
      <div
        v-if="!loading && lists.length === 0"
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
