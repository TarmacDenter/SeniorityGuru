<script setup lang="ts">
import type { Ref } from 'vue'
import { useSeniorityCore, useStanding, useTrajectory, useListExcerpt, useSeniorityLists } from '~/composables/seniority'
import { useDashboardTabs } from '~/composables/useDashboardTabs'
import { useScenario } from '~/composables/useScenario'
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
const { scopeLabel, scopeLabels, qualificationScope, growthAssumptions, growthLabel, asOfLabel } = useScenario()
const { rankCard, figures, qualificationGroups } = useStanding(qualificationScope)
const { rows: excerptRows } = useListExcerpt()
const { chartData: trajectoryChartData, keyChanges, hypotheticalLabel: trajectoryHypotheticalLabel, endedByLabel: trajectoryEndedByLabel } = useTrajectory(growthAssumptions, qualificationScope)
const compactNoticeDismissed = ref<string | null>(null)
const selectedListLabel = computed(() => listOptions.value.find(option => option.id === selectedListId.value)?.label ?? null)
const isDemoList = computed(() => !!selectedList.value?.isDemo && showDemoBadge.value)
const showScenarioStrip = computed(() => !loading.value && hasData.value && activeTab.value !== 'lists')
const compactNotice = computed(() => {
  if (showInstallBanner.value && compactNoticeDismissed.value !== 'install') return 'install'
  if (showDemoNotice.value && compactNoticeDismissed.value !== 'demo') return 'demo'
  return null
})
// The Lists panel fills the body and scrolls its own table; the other panels scroll the body.
const panelUi = computed(() => ({
  body: `flex flex-col flex-1 sm:overflow-y-auto p-0 sm:p-0${activeTab.value === 'lists' ? ' gap-0 sm:gap-0 sm:overflow-hidden' : ''}`,
}))
</script>

<template>
  <UDashboardPanel :ui="panelUi">
    <template #header>
      <SeniorityNavbar title="Dashboard" :description="navbarDescription" />

      <UDashboardToolbar class="overflow-y-hidden">
        <UTabs v-model="activeTab" :items="tabs" :content="false" variant="link" aria-label="Dashboard panels" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <DashboardInstallBanner v-if="compactNotice === 'install'" compact @dismissed="compactNoticeDismissed = 'install'" />
      <DashboardDemoBanner v-else-if="compactNotice === 'demo'" compact @dismissed="compactNoticeDismissed = 'demo'" />

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

      <template v-else>
        <DashboardScenarioStrip
          v-if="showScenarioStrip"
          v-model:scope-label="scopeLabel"
          v-model:growth-assumptions="growthAssumptions"
          :scope-labels="scopeLabels"
          :as-of-label="asOfLabel"
          :list-label="selectedListLabel"
          :growth-label="growthLabel"
          :is-demo="isDemoList"
          :is-historical="isHistorical"
        />

        <DashboardTabsMyStatusTab
          v-if="activeTab === 'now'"
          :loading="loading"
          :has-data="hasData"
          :has-employee-number="hasEmployeeNumber"
          :user-found="userFound"
          :is-new-hire-mode="isNewHireMode"
          :rank-card="rankCard"
          :figures="figures"
          :excerpt-rows="excerptRows"
        />

        <DashboardTabsNextTab
          v-else-if="activeTab === 'next'"
          :loading="loading"
          :has-data="hasData"
          :user-found="userFound"
          :chart-data="trajectoryChartData"
          :ended-by-label="trajectoryEndedByLabel"
          :key-changes="keyChanges"
          :hypothetical-label="trajectoryHypotheticalLabel"
        />

        <DashboardTabsQualificationsTab
          v-else-if="activeTab === 'qualifications'"
          :loading="loading"
          :user-found="userFound"
          :groups="qualificationGroups"
          :no-result-label="rankCard.noResultLabel"
        />

        <DashboardTabsSeniorityListTab
          v-else
          v-model:selected-list-id="selectedListId"
          :loading="loading"
          :list-options="listOptions"
          :is-demo="isDemoList"
          :is-historical="isHistorical"
        />
      </template>
    </template>
  </UDashboardPanel>
</template>
