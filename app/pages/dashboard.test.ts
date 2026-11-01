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
type ListItem = { id: number; title: string | null; effectiveDate: string; createdAt: string; isDemo?: boolean }

const {
  mockNavigateTo,
  mockRoutePath,
  mockShowDemoBadge,
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
    mockRoutePath: { value: '/dashboard/current/status' },
    mockShowDemoBadge: { value: false },
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
  path: mockRoutePath.value,
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
  useDemoBanner: () => ({ showBanner: ref(false), showBadge: ref(mockShowDemoBadge.value), hasDemoLists: ref(false), dismiss: vi.fn() }),
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
    entries: ref([]),
    projectionEndDate: ref(null),
  }),
}))

vi.mock('~/composables/seniority/modules/useStanding', () => ({
  useStanding: () => ({
    rankCard: ref({
      seniorityNumber: 12, rank: 3, rosterSize: 480, seniorityPercentile: 62.4, base: 'JFK', seat: 'CA', fleet: '737',
      hireDate: '2012-03-01', noResultLabel: null, hypotheticalLabel: null, percentileScaleLabel: null,
    }),
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

const stubs = { NuxtPage: { template: '<div data-testid="small-view" />' } }

describe('dashboard.vue — route-synced ref / watcher race condition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoutePath.value = '/dashboard/current/status'
    mockShowDemoBadge.value = false
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
    await mountSuspended(DashboardPage.default, { global: { stubs } })

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
    await mountSuspended(DashboardPage.default, { global: { stubs } })

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
    await mountSuspended(DashboardPage.default, { global: { stubs } })

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
    const wrapper = await mountSuspended(DashboardPage.default, { global: { stubs } })

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
      expect.objectContaining({ path: '/dashboard/current/status', query: expect.objectContaining({ list: String(LIST_B) }) }),
      expect.objectContaining({ replace: true }),
    )
  })
})

describe('dashboard.vue — sections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasData.value = true
    mockShowDemoBadge.value = false
    mockRoutePath.value = '/dashboard/current/status'
    mockRouteQuery.value = {}
    mockFetchLists.mockImplementation(() => { mockLists.value = [makeList(1)] })
    mockLoadPreferences.mockResolvedValue(undefined)
    mockFetchEntries.mockResolvedValue(undefined)
    mockNavigateTo.mockResolvedValue(undefined)
  })

  async function mountDashboard(path = '/dashboard/current/status') {
    mockRoutePath.value = path
    const DashboardPage = await import('./dashboard.vue')
    const wrapper = await mountSuspended(defineComponent({ render: () => h(UApp, null, () => h(DashboardPage.default)) }), { global: { stubs } })
    await vi.waitFor(() => expect(mockFetchEntries).toHaveBeenCalled())
    await nextTick()
    await nextTick()
    return wrapper
  }

  function viewTabs(wrapper: Awaited<ReturnType<typeof mountDashboard>>) {
    return wrapper.findAll('[aria-label="Section views"] a').map(link => ({ text: link.text(), current: link.attributes('aria-current') === 'page' }))
  }

  it.each([
    ['/dashboard/current/status', 'Current', [['Status', true], ['Holdability', false]]],
    ['/dashboard/current/holdability', 'Current', [['Status', false], ['Holdability', true]]],
    ['/dashboard/trajectory/projection', 'Trajectory', [['Projection', true], ['Retirements', false]]],
    ['/dashboard/trajectory/retirements', 'Trajectory', [['Projection', false], ['Retirements', true]]],
    ['/dashboard/list/full', 'List', [['Full list', true], ['Upcoming retirements', false], ['Compare', false], ['Uploads', false]]],
    ['/dashboard/list/uploads', 'List', [['Full list', false], ['Upcoming retirements', false], ['Compare', false], ['Uploads', true]]],
  ] as const)('%s is titled %s with its small views in a tab row', async (path, title, tabs) => {
    const wrapper = await mountDashboard(path)
    expect(wrapper.find('h1').text()).toContain(title)
    expect(viewTabs(wrapper)).toEqual(tabs.map(([text, current]) => ({ text, current })))
  })

  it('shows Demographics without a tab row', async () => {
    const wrapper = await mountDashboard('/dashboard/demographics')
    expect(wrapper.find('h1').text()).toContain('Demographics')
    expect(viewTabs(wrapper)).toEqual([])
  })

  it.each(['/dashboard/current/status', '/dashboard/trajectory/retirements', '/dashboard/demographics'])('shows the scenario toolbar on %s', async (path) => {
    const wrapper = await mountDashboard(path)
    expect(wrapper.find('[data-testid="scenario-strip"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('As-of Date')
    expect(wrapper.text()).toContain('Growth Assumptions')
    expect(wrapper.find('[aria-label="Seniority List"]').exists()).toBe(false)
  })

  it('shows only the list picker on List', async () => {
    const wrapper = await mountDashboard('/dashboard/list/full')
    expect(wrapper.find('[data-testid="scenario-strip"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Seniority List"]').exists()).toBe(true)
  })

  it.each(['/dashboard/current/status', '/dashboard/list/full'])('marks a historical demo list on %s', async (path) => {
    mockShowDemoBadge.value = true
    mockRouteQuery.value = { list: '1' }
    mockFetchLists.mockImplementation(() => { mockLists.value = [makeList(2), { ...makeList(1), isDemo: true }] })
    const wrapper = await mountDashboard(path)
    expect(wrapper.text()).toContain('Historical')
    expect(wrapper.text()).toContain('Demo')
  })

  it('renders the small view for the address', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.find('[data-testid="small-view"]').exists()).toBe(true)
  })

  it('leads to Upload when no list exists', async () => {
    mockFetchLists.mockImplementation(() => { mockLists.value = [] })
    mockRoutePath.value = '/dashboard/trajectory/projection'
    const DashboardPage = await import('./dashboard.vue')
    const wrapper = await mountSuspended(defineComponent({ render: () => h(UApp, null, () => h(DashboardPage.default)) }), { global: { stubs } })
    await vi.waitFor(() => expect(wrapper.text()).toContain('No seniority list yet'))
    expect(wrapper.find('a[href="/seniority/upload"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="small-view"]').exists()).toBe(false)
  })
})
