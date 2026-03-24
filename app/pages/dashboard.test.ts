// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockNavigateTo,
  mockRouteQuery,
  mockLoadPreferences,
  mockFetchLists,
  mockFetchEntries,
  mockLists,
  mockCurrentListId,
} = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockRouteQuery: { value: {} as Record<string, string> },
  mockLoadPreferences: vi.fn(),
  mockFetchLists: vi.fn(),
  mockFetchEntries: vi.fn(),
  mockLists: { value: [] as { id: number; title: string | null; effectiveDate: string; createdAt: string }[] },
  mockCurrentListId: { value: null as number | null },
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
    employeeNumber: null,
    loadPreferences: mockLoadPreferences,
  }),
}))

// ---------------------------------------------------------------------------
// Heavy composable mocks — isolate from test concerns
// ---------------------------------------------------------------------------
vi.mock('~/composables/seniority/modules/useSeniorityCore', () => ({
  useSeniorityCore: () => ({
    hasData: ref(false),
    hasAnchor: ref(false),
    isNewHireMode: ref(false),
    newHire: { syntheticEntry: ref(null) },
    lens: ref(null),
    snapshot: ref(null),
    userEntry: ref(undefined),
  }),
}))

vi.mock('~/composables/seniority/modules/useStanding', () => ({
  useStanding: () => ({
    rankCard: ref(null),
    statCards: ref([]),
    retirementSnapshot: ref(null),
    baseStatus: ref([]),
  }),
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
    mockRouteQuery.value = {}
    mockLists.value = []
    mockCurrentListId.value = null
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

  it('calls navigateTo when selectedListId changes after mount', async () => {
    const LIST_A = 1
    const LIST_B = 2

    mockRouteQuery.value = { list: String(LIST_A) }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(LIST_B), makeList(LIST_A)]
    })

    const DashboardPage = await import('./dashboard.vue')
    const wrapper = await mountSuspended(DashboardPage.default)

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
