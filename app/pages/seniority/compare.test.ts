// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockNavigateTo,
  mockRouteQuery,
  mockFetchLists,
  mockLists,
} = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockRouteQuery: { value: {} as Record<string, string> },
  mockFetchLists: vi.fn(),
  mockLists: { value: [] as { id: number; title: string | null; effectiveDate: string; createdAt: string }[] },
}))

// ---------------------------------------------------------------------------
// Nuxt auto-import mocks
// ---------------------------------------------------------------------------
mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useRoute', () => () => ({
  query: mockRouteQuery.value,
  path: '/seniority/compare',
}))

// ---------------------------------------------------------------------------
// Pinia store mocks
// ---------------------------------------------------------------------------
vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => ({
    get lists() { return mockLists.value },
    fetchLists: mockFetchLists,
  }),
}))

// ---------------------------------------------------------------------------
// Composable mocks
// ---------------------------------------------------------------------------
vi.mock('~/composables/useSeniorityCompare', () => ({
  useSeniorityCompare: () => ({
    loading: ref(false),
    error: ref(null),
    comparison: ref(null),
    listMetaA: ref(null),
    listMetaB: ref(null),
    loadComparison: vi.fn(),
  }),
}))

vi.mock('~/utils/column-definitions', () => ({
  retiredColumns: [],
  departedColumns: [],
  qualMoveColumns: [],
  rankChangeColumns: [],
  newHireColumns: [],
  qualMoveFilters: [],
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeList(id: number, effectiveDate = '2026-01-01') {
  return {
    id,
    title: 'Test List',
    effectiveDate,
    createdAt: '2026-01-01T00:00:00Z',
  }
}

describe('seniority/compare.vue — route-synced ref / watcher race condition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouteQuery.value = {}
    mockLists.value = []
    mockFetchLists.mockResolvedValue(undefined)
    mockNavigateTo.mockResolvedValue(undefined)
  })


  it('auto-selects older/newer by effectiveDate when query params are missing', async () => {
    const olderByEffective = makeList(11, '2026-01-01')
    const newestByUploadButOlderEffective = { ...makeList(22, '2025-12-01'), createdAt: '2026-04-01T00:00:00Z' }
    const newerByEffective = { ...makeList(33, '2026-03-01'), createdAt: '2026-01-01T00:00:00Z' }

    mockRouteQuery.value = {}
    mockFetchLists.mockImplementation(() => {
      // Store/composable contract provides lists in recency order.
      // Simulate effectiveDate ordering explicitly here.
      mockLists.value = [newerByEffective, olderByEffective, newestByUploadButOlderEffective]
    })

    const ComparePage = await import('./compare.vue')
    const wrapper = await mountSuspended(ComparePage.default)
    const vm = wrapper.vm as unknown as { listIdA: number | undefined; listIdB: number | undefined }

    expect(vm.listIdA).toBe(11)
    expect(vm.listIdB).toBe(33)
  })

  it('does NOT call navigateTo during mount when URL already has ?a=A&b=B', async () => {
    const A_ID = 1
    const B_ID = 2

    mockRouteQuery.value = { a: String(A_ID), b: String(B_ID) }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(B_ID, '2026-02-01'), makeList(A_ID, '2026-01-01')]
    })

    const ComparePage = await import('./compare.vue')
    await mountSuspended(ComparePage.default)

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('calls navigateTo when listIdA changes after mount', async () => {
    const A_ID = 1
    const B_ID = 2
    const NEW_A_ID = 3

    mockRouteQuery.value = { a: String(A_ID), b: String(B_ID) }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(B_ID), makeList(A_ID), makeList(NEW_A_ID)]
    })

    const ComparePage = await import('./compare.vue')
    const wrapper = await mountSuspended(ComparePage.default)

    mockNavigateTo.mockClear()

    const vm = wrapper.vm as unknown as { listIdA: number }
    vm.listIdA = NEW_A_ID

    await nextTick()
    await nextTick()

    expect(mockNavigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ a: String(NEW_A_ID) }) }),
      expect.objectContaining({ replace: true }),
    )
  })
})
