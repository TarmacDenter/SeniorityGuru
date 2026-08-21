<script setup lang="ts">
import type { Ref } from 'vue'
import { useSeniorityCore, useStanding, useSeniorityLists } from '~/composables/seniority'
import { useDashboardTabs } from '~/composables/useDashboardTabs'
import { useDemoBanner } from '~/composables/useDemoBanner'
import { DEFAULT_TAB } from '~/utils/dashboard-tabs'
import { formatDate } from '~/utils/date'

definePageMeta({ layout: 'dashboard' })

function useDashboardListSelection(activeTab: Ref<string>) {
  const route = useRoute()
  const { lists, fetchLists, fetchEntries } = useSeniorityLists()
  const { loadPreferences } = useUser()
  const loading = ref(true)
  const initializing = ref(true)
  const selectedListId = ref<number | undefined>(route.query.list ? Number(route.query.list) : undefined)
  const listOptions = computed(() => lists.value.map((list, index) => ({
    id: list.id,
    label: list.title ? `${list.title} (${formatDate(list.effectiveDate)})` : formatDate(list.effectiveDate),
    isLatest: index === 0,
  })))
  const isHistorical = computed(() => {
    if (!selectedListId.value || listOptions.value.length === 0) return false
    return selectedListId.value !== listOptions.value[0]?.id
  })
  const selectedList = computed(() => lists.value.find(list => list.id === selectedListId.value))
  const navbarDescription = computed(() => {
    const list = selectedList.value
    return list ? `${list.title || 'Seniority List'} · effective ${list.effectiveDate}` : undefined
  })

  async function syncRoute() {
    const query: Record<string, string> = {}
    if (activeTab.value !== DEFAULT_TAB) query.tab = activeTab.value
    if (selectedListId.value) query.list = String(selectedListId.value)
    await navigateTo({ path: '/dashboard', query }, { replace: true })
  }

  watch(activeTab, () => { void syncRoute() })
  watch(selectedListId, async (id, previousId) => {
    if (initializing.value || !id || !previousId) return
    loading.value = true
    await fetchEntries(id)
    await syncRoute()
    loading.value = false
  })

  onMounted(async () => {
    await loadPreferences()
    await fetchLists()
    if (!selectedListId.value || !lists.value.some(list => list.id === selectedListId.value)) {
      selectedListId.value = lists.value[0]?.id ?? undefined
    }
    if (selectedListId.value) await fetchEntries(selectedListId.value)
    initializing.value = false
    loading.value = false
  })

  return { lists, selectedListId, listOptions, isHistorical, selectedList, navbarDescription, loading }
}

const { activeTab, tabs } = useDashboardTabs()
const { lists, selectedListId, listOptions, isHistorical, selectedList, navbarDescription, loading } = useDashboardListSelection(activeTab)
const { employeeNumber } = useUser()
const { showBadge: showDemoBadge } = useDemoBanner()
const { hasData, hasAnchor: userFound, isNewHireMode, newHire, anchoredLens, projectionEndDate } = useSeniorityCore()
const hasEmployeeNumber = computed(() => !!employeeNumber.value || !!newHire.syntheticEntry.value)
const { rankCard, statCards: stats, retirementSnapshot, baseStatus: baseStatusData } = useStanding()
const trajectoryResult = computed(() => projectionEndDate.value && anchoredLens.value?.trajectory(projectionEndDate.value) || null)
const trajectoryChartData = computed(() => trajectoryResult.value?.chartData ?? { labels: [] as string[], data: [] as number[] })
const trajectoryDeltas = computed(() => trajectoryResult.value?.deltas ?? [])
const fullBleedTabs = new Set(['position', 'trajectory', 'seniority'])
const panelUi = computed(() => ({
  body: fullBleedTabs.has(activeTab.value) ? 'flex flex-col flex-1 sm:overflow-y-auto p-0' : undefined,
}))
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
