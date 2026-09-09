<script setup lang="ts">
import type { Ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useSeniorityCore, useStanding, useSeniorityLists } from '~/composables/seniority'
import { useDashboardTabs } from '~/composables/useDashboardTabs'
import { useDemoBanner } from '~/composables/useDemoBanner'
import { usePwaInstall } from '~/composables/usePwaInstall'
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
const { showBanner: showInstallBanner } = usePwaInstall()
const { showBanner: showDemoNotice } = useDemoBanner()
const { hasData, hasAnchor: userFound, isNewHireMode, newHire } = useSeniorityCore()
const hasEmployeeNumber = computed(() => !!employeeNumber.value || !!newHire.syntheticEntry.value)
const { rankCard, statCards: stats, retirementSnapshot, baseStatus: baseStatusData } = useStanding()
const { chartData: trajectoryChartData, changes: trajectoryChanges } = useTrajectory()
const isCompactViewport = useMediaQuery('(max-width: 639px), (max-height: 499px)')
const dashboardControlsOpen = ref(false)
const compactNoticeDismissed = ref<string | null>(null)
const activeTabLabel = computed(() => tabs.find(tab => String(tab.value) === activeTab.value)?.label ?? 'Dashboard')
const selectedListLabel = computed(() => listOptions.value.find(option => option.id === selectedListId.value)?.label ?? 'Select list')
const compactNotice = computed(() => {
  if (showInstallBanner.value && compactNoticeDismissed.value !== 'install') return 'install'
  if (showDemoNotice.value && compactNoticeDismissed.value !== 'demo') return 'demo'
  return null
})
const fullBleedTabs = new Set(['position', 'trajectory', 'seniority'])
const panelUi = computed(() => ({
  body: fullBleedTabs.has(activeTab.value)
    ? `flex flex-col flex-1 sm:overflow-y-auto p-0${activeTab.value === 'seniority' ? ' sm:p-0' : ''}`
    : undefined,
}))
</script>

<template>
  <UDashboardPanel :ui="panelUi">
    <template #header>
      <SeniorityNavbar title="Dashboard" :description="navbarDescription" />

      <UDashboardToolbar v-if="!isCompactViewport" class="hidden sm:flex overflow-y-hidden">
        <UTabs v-model="activeTab" :items="tabs" :content="false" variant="link" />
      </UDashboardToolbar>

      <!-- Mobile-only: scrollable tab chip row -->
      <DashboardTabChips v-if="!isCompactViewport" v-model="activeTab" :tabs="tabs" />

      <!-- Compact view: one disclosure keeps navigation and list selection out of the table viewport. -->
      <div v-if="isCompactViewport" class="border-b border-(--ui-border) p-2">
        <UCollapsible v-model:open="dashboardControlsOpen" class="flex flex-col gap-2">
          <UButton
            :label="`Controls · ${activeTabLabel} · ${selectedListLabel}`"
            color="neutral"
            variant="outline"
            size="sm"
            trailing-icon="i-lucide-sliders-horizontal"
            block
            class="justify-between"
          />
          <template #content>
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <USelect v-model="activeTab" :items="tabs" value-key="value" label-key="label" class="min-w-40 flex-1" />
              <USelectMenu
                v-if="lists.length > 0"
                v-model="selectedListId"
                :items="listOptions"
                value-key="id"
                label-key="label"
                placeholder="Select list..."
                size="sm"
                class="min-w-40 flex-1"
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
        </UCollapsible>
      </div>

      <!-- List selector — all breakpoints -->
      <div v-if="lists.length > 0 && !isCompactViewport" class="flex items-center gap-2 px-3 py-1.5 border-b border-(--ui-border)">
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
      <template v-if="isCompactViewport">
        <DashboardInstallBanner v-if="compactNotice === 'install'" compact @dismissed="compactNoticeDismissed = 'install'" />
        <DashboardDemoBanner v-else-if="compactNotice === 'demo'" compact @dismissed="compactNoticeDismissed = 'demo'" />
      </template>
      <template v-else>
        <DashboardInstallBanner />
        <DashboardDemoBanner />
      </template>

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
        :trajectory-changes="trajectoryChanges"
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
      <DashboardTabsSeniorityListTab v-else-if="activeTab === 'seniority'" :loading="loading" :compact-controls-open="dashboardControlsOpen" />

      <!-- Retirements tab -->
      <DashboardTabsRetirementsTab v-else-if="activeTab === 'retirements'" />

      <div v-else />
    </template>
  </UDashboardPanel>
</template>
