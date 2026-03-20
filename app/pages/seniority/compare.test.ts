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
  mockLists: { value: [] as { id: string; airline: string; title: string | null; effective_date: string; created_at: string }[] },
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
function makeList(id: string, effectiveDate = '2026-01-01') {
  return {
    id,
    airline: 'DAL',
    title: 'Test List',
    effective_date: effectiveDate,
    created_at: '2026-01-01T00:00:00Z',
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

  it('does NOT call navigateTo during mount when URL already has ?a=A&b=B', async () => {
    const A_ID = 'list-a'
    const B_ID = 'list-b'

    mockRouteQuery.value = { a: A_ID, b: B_ID }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(B_ID, '2026-02-01'), makeList(A_ID, '2026-01-01')]
    })

    const ComparePage = await import('./compare.vue')
    await mountSuspended(ComparePage.default)

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('calls navigateTo when listIdA changes after mount', async () => {
    const A_ID = 'list-a'
    const B_ID = 'list-b'
    const NEW_A_ID = 'list-c'

    mockRouteQuery.value = { a: A_ID, b: B_ID }
    mockFetchLists.mockImplementation(() => {
      mockLists.value = [makeList(B_ID), makeList(A_ID), makeList(NEW_A_ID)]
    })

    const ComparePage = await import('./compare.vue')
    const wrapper = await mountSuspended(ComparePage.default)

    mockNavigateTo.mockClear()

    const vm = wrapper.vm as unknown as { listIdA: string }
    vm.listIdA = NEW_A_ID

    await nextTick()
    await nextTick()

    expect(mockNavigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ a: NEW_A_ID }) }),
      expect.objectContaining({ replace: true }),
    )
  })
})
