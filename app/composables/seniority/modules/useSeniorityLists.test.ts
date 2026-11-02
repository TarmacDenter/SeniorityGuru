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
const { parsePlainDate, Temporal } = await import('~/utils/temporal')

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

describe('List › Uploads summary', () => {
  function list(id: number, effective: string, uploaded: string, title?: string) {
    return { id, title, effectiveDate: parsePlainDate(effective), createdAt: Temporal.Instant.from(uploaded) }
  }

  it('counts the lists uploaded', () => {
    mockStore.lists = [list(1, '2025-01-01', '2025-01-02T00:00:00Z'), list(2, '2025-02-01', '2025-02-02T00:00:00Z')]
    expect(useSeniorityLists().listCountLabel.value).toBe('2')
  })

  it('lists the five most recent uploads, newest first, named by title or Effective Date', () => {
    mockStore.lists = [1, 2, 3, 4, 5, 6].map(n => list(n, `2025-0${n}-01`, `2025-0${n}-15T12:00:00Z`, n === 6 ? 'June list' : undefined))
    const recent = useSeniorityLists().recentLists.value

    expect(recent.map(item => item.id)).toEqual([6, 5, 4, 3, 2])
    expect(recent[0]).toMatchObject({ title: 'June list', description: 'Effective 2025-06-01' })
    expect(recent[1]).toMatchObject({ title: '2025-05-01', description: 'Effective 2025-05-01' })
    expect(recent[0]!.date).toMatch(/2025/)
  })
})
