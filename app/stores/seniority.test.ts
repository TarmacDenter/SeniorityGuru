import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LocalSeniorityList } from '~/utils/db'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'

// ---------------------------------------------------------------------------
// Mock db module
// ---------------------------------------------------------------------------

const mockDb = vi.hoisted(() => ({
  seniorityLists: {
    orderBy: vi.fn(),
    reverse: vi.fn(),
    toArray: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
  },
  seniorityEntries: {
    where: vi.fn(),
    equals: vi.fn(),
    toArray: vi.fn(),
  },
  deleteList: vi.fn(),
}))

vi.mock('~/utils/db', () => ({ db: mockDb }))

// db-adapters: real implementation (it's pure)
// No mock needed — it just maps fields.

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockList1: LocalSeniorityList = {
  id: 1,
  title: 'January List',
  effectiveDate: '2026-01-15',
  createdAt: '2026-01-10T12:00:00Z',
}

const mockList2: LocalSeniorityList = {
  id: 2,
  title: null,
  effectiveDate: '2026-02-15',
  createdAt: '2026-02-10T12:00:00Z',
}

const mockLocalEntry = {
  id: 1,
  listId: 1,
  seniorityNumber: 1,
  employeeNumber: '12345',
  name: 'Smith, John',
  seat: 'CA',
  base: 'JFK',
  fleet: '737',
  hireDate: '2010-01-15',
  retireDate: '2035-06-15',
}

const expectedAdaptedEntry: SeniorityEntry = {
  seniority_number: 1,
  employee_number: '12345',
  name: 'Smith, John',
  seat: 'CA',
  base: 'JFK',
  fleet: '737',
  hire_date: '2010-01-15',
  retire_date: '2035-06-15',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('seniority store (Dexie)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default chain: orderBy → reverse → toArray → []
    mockDb.seniorityLists.orderBy.mockReturnValue(mockDb.seniorityLists)
    mockDb.seniorityLists.reverse.mockReturnValue(mockDb.seniorityLists)
    mockDb.seniorityLists.toArray.mockResolvedValue([])
    mockDb.seniorityLists.update.mockResolvedValue(1)

    // Default chain: where → equals → toArray → []
    mockDb.seniorityEntries.where.mockReturnValue(mockDb.seniorityEntries)
    mockDb.seniorityEntries.equals.mockReturnValue(mockDb.seniorityEntries)
    mockDb.seniorityEntries.toArray.mockResolvedValue([])

    mockDb.deleteList.mockResolvedValue(undefined)
  })

  describe('fetchLists', () => {
    it('queries Dexie orderBy effectiveDate descending and populates lists', async () => {
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1, mockList2])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.fetchLists()

      expect(mockDb.seniorityLists.orderBy).toHaveBeenCalledWith('effectiveDate')
      expect(mockDb.seniorityLists.reverse).toHaveBeenCalled()
      expect(store.lists).toHaveLength(2)
      expect(store.lists[0]!.id).toBe(1)
      expect(store.lists[1]!.id).toBe(2)
    })

    it('sets listsError and clears lists on failure', async () => {
      mockDb.seniorityLists.toArray.mockRejectedValue(new Error('DB error'))

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.fetchLists()

      expect(store.listsError).toBeTruthy()
      expect(store.lists).toHaveLength(0)
    })

    it('clears listsLoading to false after fetch', async () => {
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.fetchLists()

      expect(store.listsLoading).toBe(false)
    })
  })

  describe('fetchEntries', () => {
    it('queries entries by listId and adapts them to SeniorityEntry', async () => {
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.fetchEntries(1)

      expect(mockDb.seniorityEntries.where).toHaveBeenCalledWith('listId')
      expect(mockDb.seniorityEntries.equals).toHaveBeenCalledWith(1)
      expect(store.entries).toHaveLength(1)
      expect(store.entries[0]).toEqual(expectedAdaptedEntry)
      expect(store.currentListId).toBe(1)
    })

    it('sets entriesError on failure', async () => {
      mockDb.seniorityEntries.toArray.mockRejectedValue(new Error('DB error'))

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.fetchEntries(1)

      expect(store.entriesError).toBeTruthy()
      expect(store.entries).toHaveLength(0)
    })

    it('stores currentListId as number', async () => {
      mockDb.seniorityEntries.toArray.mockResolvedValue([])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.fetchEntries(42)

      expect(store.currentListId).toBe(42)
      expect(typeof store.currentListId).toBe('number')
    })
  })

  describe('updateList', () => {
    it('calls db.seniorityLists.update with id and updates', async () => {
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1, mockList2])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()
      await store.fetchLists()

      await store.updateList(1, { title: 'Updated Title' })

      expect(mockDb.seniorityLists.update).toHaveBeenCalledWith(1, { title: 'Updated Title' })
    })

    it('patches the matching list in the reactive array', async () => {
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1, mockList2])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()
      await store.fetchLists()

      await store.updateList(1, { title: 'New Name' })

      const updated = store.lists.find(l => l.id === 1)
      expect(updated!.title).toBe('New Name')
    })
  })

  describe('deleteList', () => {
    it('calls db.deleteList(id) and removes the list from state', async () => {
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1, mockList2])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()
      await store.fetchLists()

      await store.deleteList(1)

      expect(mockDb.deleteList).toHaveBeenCalledWith(1)
      expect(store.lists).toHaveLength(1)
      expect(store.lists[0]!.id).toBe(2)
    })

    it('clears entries and currentListId when deleted list was current', async () => {
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1, mockList2])
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()
      await store.fetchLists()
      await store.fetchEntries(1)

      expect(store.currentListId).toBe(1)
      expect(store.entries).toHaveLength(1)

      await store.deleteList(1)

      expect(store.entries).toHaveLength(0)
      expect(store.currentListId).toBeNull()
    })

    it('does not clear entries when a non-current list is deleted', async () => {
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1, mockList2])
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()
      await store.fetchLists()
      await store.fetchEntries(1)

      // Delete list 2 while list 1 is current
      await store.deleteList(2)

      expect(store.currentListId).toBe(1)
      expect(store.entries).toHaveLength(1)
    })
  })

  describe('clearStore', () => {
    it('resets all state to empty/null', async () => {
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1])
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      await store.fetchLists()
      await store.fetchEntries(1)

      store.clearStore()

      expect(store.lists).toHaveLength(0)
      expect(store.entries).toHaveLength(0)
      expect(store.currentListId).toBeNull()
      expect(store.listsLoading).toBe(false)
      expect(store.entriesLoading).toBe(false)
      expect(store.listsError).toBeNull()
      expect(store.entriesError).toBeNull()
    })
  })
})
