// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockNavigateTo,
  mockRouteQuery,
  mockFetchProfile,
  mockFetchLists,
  mockFetchEntries,
  mockLists,
  mockCurrentListId,
} = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockRouteQuery: { value: {} as Record<string, string> },
  mockFetchProfile: vi.fn(),
  mockFetchLists: vi.fn(),
  mockFetchEntries: vi.fn(),
  mockLists: { value: [] as { id: string; airline: string; title: string | null; effective_date: string; status: string; created_at: string }[] },
  mockCurrentListId: { value: null as string | null },
}))

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
    get lists() { return mockLists.value },
    get currentListId() { return mockCurrentListId.value },
    fetchLists: mockFetchLists,
    fetchEntries: mockFetchEntries,
  }),
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    profile: { icao_code: 'DAL', role: 'user' },
    fetchProfile: mockFetchProfile,
  }),
}))

// ---------------------------------------------------------------------------
// Heavy composable mocks — isolate from test concerns
// ---------------------------------------------------------------------------
vi.mock('~/composables/useDashboardStats', () => ({
  useDashboardStats: () => ({
    hasData: ref(false),
    hasEmployeeNumber: ref(false),
    userFound: ref(false),
    isNewHireMode: ref(false),
    rankCard: ref(null),
    stats: ref([]),
    retirementSnapshot: ref(null),
    trajectoryDeltas: ref(null),
    baseStatusData: ref(null),
    trajectoryChartData: ref([]),
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeList(id: string) {
  return {
    id,
    airline: 'DAL',
    title: 'Test List',
    effective_date: '2026-01-01',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
  }
}

describe('dashboard.vue — route-synced ref / watcher race condition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouteQuery.value = {}
    mockLists.value = []
    mockCurrentListId.value = null
    mockFetchLists.mockResolvedValue(undefined)
    mockFetchProfile.mockResolvedValue(undefined)
    mockFetchEntries.mockResolvedValue(undefined)
    mockNavigateTo.mockResolvedValue(undefined)
  })

  it('does NOT call navigateTo during mount when URL already has ?list=X', async () => {
    const LIST_ID = 'list-123'
    mockRouteQuery.value = { list: LIST_ID }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(LIST_ID)]
    })

    const DashboardPage = await import('./dashboard.vue')
    await mountSuspended(DashboardPage.default)

    // After full mount cycle, navigateTo must not have been called for list init
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('calls fetchEntries exactly once with the URL param ID (not the first-list default)', async () => {
    const OLD_ID = 'old-list'
    const NEW_ID = 'new-list'

    mockRouteQuery.value = { list: OLD_ID }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(NEW_ID), makeList(OLD_ID)]
    })

    const DashboardPage = await import('./dashboard.vue')
    await mountSuspended(DashboardPage.default)

    expect(mockFetchEntries).toHaveBeenCalledTimes(1)
    expect(mockFetchEntries).toHaveBeenCalledWith(OLD_ID)
  })

  it('calls navigateTo when selectedListId changes after mount', async () => {
    const LIST_A = 'list-a'
    const LIST_B = 'list-b'

    mockRouteQuery.value = { list: LIST_A }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(LIST_B), makeList(LIST_A)]
    })

    const DashboardPage = await import('./dashboard.vue')
    const wrapper = await mountSuspended(DashboardPage.default)

    // Clear navigateTo calls from mount
    mockNavigateTo.mockClear()
    mockFetchEntries.mockClear()

    // Simulate user picking a different list from the dropdown
    const vm = wrapper.vm as unknown as { selectedListId: string }
    vm.selectedListId = LIST_B

    await nextTick()
    await nextTick()

    expect(mockFetchEntries).toHaveBeenCalledWith(LIST_B)
    expect(mockNavigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ list: LIST_B }) }),
      expect.objectContaining({ replace: true }),
    )
  })
})
