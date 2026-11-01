// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'

enableAutoUnmount(afterEach)

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
type ListItem = { id: number; title: string | null; effectiveDate: string; createdAt: string }

const {
  mockNavigateTo,
  mockRouteQuery,
  mockLoadPreferences,
  mockFetchLists,
  mockFetchEntries,
  mockLists,
  mockHasData,
} = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockNavigateTo: vi.fn(),
    mockRouteQuery: { value: {} as Record<string, string> },
    mockLoadPreferences: vi.fn(),
    mockFetchLists: vi.fn(),
    mockFetchEntries: vi.fn(),
    mockLists: vRef([] as ListItem[]),
    mockHasData: { value: false },
  }
})

// ---------------------------------------------------------------------------
// Nuxt auto-import mocks
// ---------------------------------------------------------------------------
mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useRoute', () => () => ({
  query: mockRouteQuery.value,
  path: '/dashboard',
}))

// ---------------------------------------------------------------------------
// Pinia store mocks (NOT Nuxt auto-imports)
// ---------------------------------------------------------------------------
vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => ({
    entries: [],
  }),
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    employeeNumber: null,
    loadPreferences: mockLoadPreferences,
    getPreference: vi.fn().mockResolvedValue(null),
    savePreference: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('~/composables/seniority/modules/useSeniorityLists', () => ({
  useSeniorityLists: () => ({
    lists: mockLists,
    listsLoading: ref(false),
    listsError: ref(null),
    entriesLoading: ref(false),
    fetchLists: mockFetchLists,
    fetchEntries: mockFetchEntries,
  }),
}))

vi.mock('~/composables/useDemoBanner', () => ({
  useDemoBanner: () => ({ showBanner: ref(false), showBadge: ref(false), hasDemoLists: ref(false), dismiss: vi.fn() }),
}))

vi.mock('~/composables/usePwaInstall', () => ({
  usePwaInstall: () => ({ showBanner: ref(false), isIos: false, showIosModal: ref(false), standalone: false, install: vi.fn(), snooze: vi.fn(), dismiss: vi.fn() }),
}))

// ---------------------------------------------------------------------------
// Heavy composable mocks — isolate from test concerns
// ---------------------------------------------------------------------------
vi.mock('~/composables/seniority/modules/useSeniorityCore', () => ({
  useSeniorityCore: () => ({
    hasData: ref(mockHasData.value),
    listAnalysis: ref(null),
    hasAnchor: ref(mockHasData.value),
    isNewHireMode: ref(false),
    newHire: { syntheticEntry: ref(null) },
    analysis: ref(null),
    anchoredAnalysis: ref(null),
    userEntry: ref(undefined),
    projectionEndDate: ref(null),
  }),
}))

vi.mock('~/composables/seniority/modules/useStanding', () => ({
  useStanding: () => ({
    rankCard: ref({
      seniorityNumber: 12, rank: 3, rosterSize: 480, seniorityPercentile: 62.4, base: 'JFK', seat: 'CA', fleet: '737',
      hireDate: '2012-03-01', noResultLabel: null, hypotheticalLabel: null, percentileScaleLabel: null,
    }),
    statCards: ref([]),
    retirementSnapshot: ref(null),
    baseStatus: ref([]),
    qualificationGroups: ref([]),
    figures: ref([{ label: 'Rank', value: '3' }]),
  }),
}))

vi.mock('~/composables/seniority/modules/useTrajectory', () => ({
  useTrajectory: () => ({
    chartData: ref({ labels: [], data: [] }),
    changes: ref([]),
    keyChanges: ref([]),
    hypotheticalLabel: ref(null),
    endedByLabel: ref(null),
    fullTrajectory: ref([]),
    computeRetirementProjection: () => ({ labels: [], data: [], scopedPilotCount: 0 }),
    computeComparativeTrajectory: () => ({ labels: [], baselineData: [], comparisonData: [], noResultLabel: null }),
  }),
}))

vi.mock('~/composables/seniority/modules/useListExcerpt', () => ({
  useListExcerpt: () => ({ rows: ref([]) }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeList(id: number) {
  return {
    id,
    title: 'Test List',
    effectiveDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
  }
}

describe('dashboard.vue — route-synced ref / watcher race condition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasData.value = false
    mockRouteQuery.value = {}
    mockLists.value = []
    mockFetchLists.mockResolvedValue(undefined)
    mockLoadPreferences.mockResolvedValue(undefined)
    mockFetchEntries.mockResolvedValue(undefined)
    mockNavigateTo.mockResolvedValue(undefined)
  })

  it('does NOT call navigateTo during mount when URL already has ?list=X', async () => {
    const LIST_ID = 42
    mockRouteQuery.value = { list: String(LIST_ID) }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(LIST_ID)]
    })

    const DashboardPage = await import('./dashboard.vue')
    await mountSuspended(DashboardPage.default)

    // After full mount cycle, navigateTo must not have been called for list init
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('calls fetchEntries exactly once with the URL param ID (not the first-list default)', async () => {
    const OLD_ID = 10
    const NEW_ID = 20

    mockRouteQuery.value = { list: String(OLD_ID) }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(NEW_ID), makeList(OLD_ID)]
    })

    const DashboardPage = await import('./dashboard.vue')
    await mountSuspended(DashboardPage.default)

    expect(mockFetchEntries).toHaveBeenCalledTimes(1)
    expect(mockFetchEntries).toHaveBeenCalledWith(OLD_ID)
  })

  it('falls back to latest list when URL list id is stale', async () => {
    const STALE_ID = 999
    const LATEST_ID = 77

    mockRouteQuery.value = { list: String(STALE_ID) }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(LATEST_ID)]
    })

    const DashboardPage = await import('./dashboard.vue')
    await mountSuspended(DashboardPage.default)

    expect(mockFetchEntries).toHaveBeenCalledTimes(1)
    expect(mockFetchEntries).toHaveBeenCalledWith(LATEST_ID)
  })

  it('calls navigateTo when selectedListId changes after mount', async () => {
    const LIST_A = 1
    const LIST_B = 2

    mockRouteQuery.value = { list: String(LIST_A) }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(LIST_B), makeList(LIST_A)]
    })

    const DashboardPage = await import('./dashboard.vue')
    const wrapper = await mountSuspended(DashboardPage.default)

    await vi.waitFor(() => {
      expect(mockFetchEntries).toHaveBeenCalledWith(LIST_A)
    })

    // Clear navigateTo calls from mount
    mockNavigateTo.mockClear()
    mockFetchEntries.mockClear()

    // Simulate user picking a different list from the dropdown
    const vm = wrapper.vm as unknown as { selectedListId: number }
    vm.selectedListId = LIST_B

    await nextTick()
    await nextTick()

    expect(mockFetchEntries).toHaveBeenCalledWith(LIST_B)
    expect(mockNavigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ list: String(LIST_B) }) }),
      expect.objectContaining({ replace: true }),
    )
  })
})

describe('dashboard.vue — panels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasData.value = true
    clearNuxtState('dashboardActiveTab')
    mockRouteQuery.value = {}
    mockFetchLists.mockImplementation(() => { mockLists.value = [makeList(1)] })
    mockLoadPreferences.mockResolvedValue(undefined)
    mockFetchEntries.mockResolvedValue(undefined)
    mockNavigateTo.mockResolvedValue(undefined)
  })

  async function mountDashboard() {
    const DashboardPage = await import('./dashboard.vue')
    const wrapper = await mountSuspended(defineComponent({ render: () => h(UApp, null, () => h(DashboardPage.default)) }))
    await vi.waitFor(() => expect(mockFetchEntries).toHaveBeenCalled())
    await nextTick()
    await nextTick()
    return wrapper
  }

  it('names the four panels and opens Now first', async () => {
    const wrapper = await mountDashboard()
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map(tab => tab.text())).toEqual(['Now', 'Next', 'Qualifications', 'Lists'])
    expect(tabs.filter(tab => tab.attributes('aria-selected') === 'true').map(tab => tab.text())).toEqual(['Now'])
    expect(wrapper.text()).toContain('Your line on the Seniority List')
  })

  it('shows the scenario strip on Now', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.find('[data-testid="scenario-strip"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('As-of Date')
    expect(wrapper.text()).toContain('Growth Assumptions')
  })

  it.each([
    ['status', 'Your line on the Seniority List'],
    ['trajectory', 'Your Seniority Percentile over time'],
    ['position', 'Qualification directory'],
    ['demographics', 'Qualification directory'],
    ['seniority', 'Compare'],
    ['retirements', 'Compare'],
    ['nonsense', 'Your line on the Seniority List'],
  ])('lands an old ?tab=%s link on the matching panel', async (oldTab, expectedText) => {
    mockRouteQuery.value = { tab: oldTab }
    const wrapper = await mountDashboard()
    expect(wrapper.text()).toContain(expectedText)
  })

  it('hides the scenario strip on Lists, which holds list selection', async () => {
    mockRouteQuery.value = { tab: 'lists' }
    const wrapper = await mountDashboard()
    expect(wrapper.find('[data-testid="scenario-strip"]').exists()).toBe(false)
  })
})
