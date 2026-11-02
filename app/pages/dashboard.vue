<script setup lang="ts">
import { useSeniorityCore, useSeniorityLists } from '~/composables/seniority'
import { useDashboardList } from '~/composables/useDashboardList'
import { useDashboardSections } from '~/composables/useDashboardSections'
import { useScenario } from '~/composables/useScenario'
import { useDemoBanner } from '~/composables/useDemoBanner'
import { usePwaInstall } from '~/composables/usePwaInstall'

// The dashboard shell: section title, small-view tabs, scenario toolbar or list picker, and the small view itself.
// It stays mounted while moving between sections, so the chosen list loads once.
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { fetchLists, fetchEntries } = useSeniorityLists()
const { loadPreferences } = useUser()
const { lists, selectedListId, loading, listOptions, isHistorical, isDemoList, navbarDescription } = useDashboardList()
const { section, viewItems } = useDashboardSections()

function useListSelectionRoute() {
  const initializing = ref(true)
  loading.value = true
  selectedListId.value = route.query.list ? Number(route.query.list) : undefined

  async function syncRoute() {
    const query: Record<string, string> = { ...(route.query as Record<string, string>) }
    if (selectedListId.value) query.list = String(selectedListId.value)
    await navigateTo({ path: route.path, query }, { replace: true })
  }

  // A link that names a list (e.g. from List › Uploads) selects it while the dashboard is open.
  watch(() => route.query.list, (raw) => {
    const id = raw ? Number(raw) : undefined
    if (!initializing.value && id && id !== selectedListId.value) selectedListId.value = id
  })
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
    if (selectedListId.value) {
      await fetchEntries(selectedListId.value)
      if (route.query.list !== String(selectedListId.value)) await syncRoute()
    }
    initializing.value = false
    loading.value = false
  })
}

useListSelectionRoute()

const { showBanner: showInstallBanner } = usePwaInstall()
const { showBanner: showDemoNotice } = useDemoBanner()
const { hasData, hasAnchor } = useSeniorityCore()
const { scopeLabel, scopeLabels, growthAssumptions, growthLabel, asOfLabel } = useScenario()
const compactNoticeDismissed = ref<string | null>(null)
const showScenarioStrip = computed(() => !loading.value && hasData.value && !!section.value?.hasScenario
  && (hasAnchor.value || !section.value.needsAnchor))
// The list picker serves the List views that read the chosen list; Compare and Uploads pick their own.
const showListPicker = computed(() => route.path === '/dashboard/list/full' || route.path === '/dashboard/list/retirements')
const compactNotice = computed(() => {
  if (showInstallBanner.value && compactNoticeDismissed.value !== 'install') return 'install'
  if (showDemoNotice.value && compactNoticeDismissed.value !== 'demo') return 'demo'
  return null
})
// List › Full list fills the body and scrolls its own table; the other views scroll the body.
const panelUi = computed(() => ({
  body: `flex flex-col flex-1 sm:overflow-y-auto p-0 sm:p-0${route.path === '/dashboard/list/full' ? ' gap-0 sm:gap-0 sm:overflow-hidden' : ''}`,
}))
</script>

<template>
  <UDashboardPanel :ui="panelUi">
    <template #header>
      <SeniorityNavbar :title="section?.label ?? 'Dashboard'" :description="navbarDescription" />

      <UDashboardToolbar v-if="viewItems.length > 0" class="overflow-x-auto overflow-y-hidden">
        <UNavigationMenu :items="viewItems" highlight aria-label="Section views" class="-mx-1 flex-1" :ui="{ link: 'whitespace-nowrap' }" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <DashboardInstallBanner v-if="compactNotice === 'install'" @dismissed="compactNoticeDismissed = 'install'" />
      <DashboardDemoBanner v-else-if="compactNotice === 'demo'" @dismissed="compactNoticeDismissed = 'demo'" />

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
          v-model:selected-list-id="selectedListId"
          v-model:scope-label="scopeLabel"
          v-model:growth-assumptions="growthAssumptions"
          :scope-labels="scopeLabels"
          :as-of-label="asOfLabel"
          :list-options="listOptions"
          :growth-label="growthLabel"
          :is-demo="isDemoList"
          :is-historical="isHistorical"
        />
        <DashboardListPicker
          v-if="showListPicker"
          v-model:selected-list-id="selectedListId"
          :list-options="listOptions"
          :is-demo="isDemoList"
          :is-historical="isHistorical"
        />

        <NuxtPage />
      </template>
    </template>
  </UDashboardPanel>
</template>
