// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStore = vi.hoisted(() => ({
  lists: [] as any[],
  listsLoading: false,
  listsError: null as string | null,
  fetchLists: vi.fn(),
  deleteList: vi.fn(),
  updateList: vi.fn(),
  fetchEntries: vi.fn(),
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))

const { useSeniorityLists } = await import('./useSeniorityLists')

describe('useSeniorityLists', () => {
  beforeEach(() => {
    mockStore.lists = []
    mockStore.listsLoading = false
    mockStore.listsError = null
    mockStore.fetchLists.mockReset().mockResolvedValue(undefined)
    mockStore.deleteList.mockReset().mockResolvedValue(undefined)
    mockStore.updateList.mockReset().mockResolvedValue(undefined)
    mockStore.fetchEntries.mockReset().mockResolvedValue(undefined)
  })

  it('exposes lists from the store', () => {
    mockStore.lists = [{ id: 1, effectiveDate: '2025-01-01', createdAt: '' }]
    const { lists } = useSeniorityLists()
    expect(lists.value).toHaveLength(1)
  })

  it('listOptions builds label from title when present', () => {
    mockStore.lists = [{ id: 1, title: 'Jan List', effectiveDate: '2025-01-01', createdAt: '' }]
    const { listOptions } = useSeniorityLists()
    expect(listOptions.value[0]!.label).toBe('Jan List — 2025-01-01')
    expect(listOptions.value[0]!.value).toBe(1)
  })

  it('listOptions falls back to effectiveDate when title is absent', () => {
    mockStore.lists = [{ id: 2, title: '', effectiveDate: '2025-06-01', createdAt: '' }]
    const { listOptions } = useSeniorityLists()
    expect(listOptions.value[0]!.label).toBe('2025-06-01')
  })

  it('fetchLists always delegates to store.fetchLists', async () => {
    mockStore.lists = [{ id: 1, effectiveDate: '2025-01-01', createdAt: '' }]
    const { fetchLists } = useSeniorityLists()
    await fetchLists()
    expect(mockStore.fetchLists).toHaveBeenCalledOnce()
  })

  it('deleteList delegates to store.deleteList', async () => {
    const { deleteList } = useSeniorityLists()
    await deleteList(42)
    expect(mockStore.deleteList).toHaveBeenCalledWith(42)
  })

  it('updateList delegates to store.updateList', async () => {
    const { updateList } = useSeniorityLists()
    await updateList(7, { title: 'Updated' })
    expect(mockStore.updateList).toHaveBeenCalledWith(7, { title: 'Updated' })
  })

  it('fetchEntries delegates to store.fetchEntries', async () => {
    const { fetchEntries } = useSeniorityLists()
    await fetchEntries(3)
    expect(mockStore.fetchEntries).toHaveBeenCalledWith(3)
  })
})
