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
    add: vi.fn(),
    clear: vi.fn(),
  },
  seniorityEntries: {
    where: vi.fn(),
    equals: vi.fn(),
    toArray: vi.fn(),
    bulkAdd: vi.fn(),
    clear: vi.fn(),
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

  describe('addList', () => {
    it('writes list and entries to Dexie and pushes list onto reactive array', async () => {
      mockDb.seniorityLists.add.mockResolvedValue(42)
      mockDb.seniorityEntries.bulkAdd.mockResolvedValue(undefined)

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      const listId = await store.addList(
        { title: 'March List', effectiveDate: '2026-03-15' },
        [
          { seniorityNumber: 1, employeeNumber: 'E001', name: 'Smith', seat: 'CA', base: 'LAX', fleet: '737', hireDate: '2010-01-01', retireDate: '2040-01-01' },
        ],
      )

      expect(listId).toBe(42)
      expect(mockDb.seniorityLists.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'March List', effectiveDate: '2026-03-15' }),
      )
      expect(mockDb.seniorityEntries.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ listId: 42, employeeNumber: 'E001' }),
        ]),
      )
      expect(store.lists).toHaveLength(1)
      expect(store.lists[0]!.id).toBe(42)
      expect(store.lists[0]!.title).toBe('March List')
    })

    it('passes isDemo flag to Dexie when provided', async () => {
      mockDb.seniorityLists.add.mockResolvedValue(99)
      mockDb.seniorityEntries.bulkAdd.mockResolvedValue(undefined)

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.addList(
        { title: 'Demo List', effectiveDate: '2026-01-01', isDemo: true },
        [],
      )

      expect(mockDb.seniorityLists.add).toHaveBeenCalledWith(
        expect.objectContaining({ isDemo: true }),
      )
    })

    it('does not change currentListId or entries', async () => {
      mockDb.seniorityLists.add.mockResolvedValue(42)
      mockDb.seniorityEntries.bulkAdd.mockResolvedValue(undefined)
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      // Load existing entries for list 1
      await store.fetchEntries(1)
      expect(store.currentListId).toBe(1)
      expect(store.entries).toHaveLength(1)

      // Add a new list — should NOT touch current selection
      await store.addList(
        { title: 'New List', effectiveDate: '2026-04-01' },
        [{ seniorityNumber: 1, employeeNumber: 'E999', name: null, seat: 'FO', base: 'ORD', fleet: 'A320', hireDate: '2020-01-01', retireDate: '2050-01-01' }],
      )

      expect(store.currentListId).toBe(1)
      expect(store.entries).toHaveLength(1)
      expect(store.entries[0]!.employee_number).toBe('12345')
    })
  })

  describe('getEntriesForList', () => {
    it('returns adapted entries without changing store.entries', async () => {
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      const result = await store.getEntriesForList(1)

      expect(mockDb.seniorityEntries.where).toHaveBeenCalledWith('listId')
      expect(mockDb.seniorityEntries.equals).toHaveBeenCalledWith(1)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(expectedAdaptedEntry)
      // Store entries should remain empty — not cached in reactive state
      expect(store.entries).toHaveLength(0)
      expect(store.currentListId).toBeNull()
    })

    it('second call to same listId returns cached result without querying Dexie', async () => {
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.getEntriesForList(100)
      await store.getEntriesForList(100)

      // Dexie where() should only have been called once for listId 100
      const whereCallsFor100 = mockDb.seniorityEntries.equals.mock.calls.filter(
        (args: number[]) => args[0] === 100,
      )
      expect(whereCallsFor100).toHaveLength(1)
    })

    it('different listId triggers a new Dexie query', async () => {
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      await store.getEntriesForList(100)
      await store.getEntriesForList(200)

      expect(mockDb.seniorityEntries.equals).toHaveBeenCalledWith(100)
      expect(mockDb.seniorityEntries.equals).toHaveBeenCalledWith(200)
    })
  })

  describe('entry cache invalidation', () => {
    it('deleteList invalidates cache for that listId', async () => {
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()
      await store.fetchLists()

      // Populate cache
      await store.getEntriesForList(1)
      vi.clearAllMocks()

      // Re-setup mock chain after clearAllMocks
      mockDb.seniorityEntries.where.mockReturnValue(mockDb.seniorityEntries)
      mockDb.seniorityEntries.equals.mockReturnValue(mockDb.seniorityEntries)
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])
      mockDb.deleteList.mockResolvedValue(undefined)

      // Delete list 1 — should invalidate its cache
      await store.deleteList(1)

      // Next getEntriesForList should query Dexie again
      await store.getEntriesForList(1)
      expect(mockDb.seniorityEntries.where).toHaveBeenCalled()
    })

    it('addList clears entire entry cache', async () => {
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      store.clearStore()

      // Populate cache
      await store.getEntriesForList(100)
      vi.clearAllMocks()

      // Re-setup mock chain
      mockDb.seniorityEntries.where.mockReturnValue(mockDb.seniorityEntries)
      mockDb.seniorityEntries.equals.mockReturnValue(mockDb.seniorityEntries)
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])
      mockDb.seniorityLists.add.mockResolvedValue(42)
      mockDb.seniorityEntries.bulkAdd.mockResolvedValue(undefined)

      // Add a new list — clears all cache
      await store.addList(
        { title: 'New', effectiveDate: '2026-04-01' },
        [{ seniorityNumber: 1, employeeNumber: 'E999', name: null, seat: 'FO', base: 'ORD', fleet: 'A320', hireDate: '2020-01-01', retireDate: '2050-01-01' }],
      )

      // Next call should query Dexie
      await store.getEntriesForList(100)
      expect(mockDb.seniorityEntries.where).toHaveBeenCalled()
    })

    it('clearStore clears entire entry cache', async () => {
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()

      // Populate cache
      await store.getEntriesForList(100)
      vi.clearAllMocks()

      // Re-setup mock chain
      mockDb.seniorityEntries.where.mockReturnValue(mockDb.seniorityEntries)
      mockDb.seniorityEntries.equals.mockReturnValue(mockDb.seniorityEntries)
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      store.clearStore()

      // Next call should query Dexie
      await store.getEntriesForList(100)
      expect(mockDb.seniorityEntries.where).toHaveBeenCalled()
    })
  })

  describe('getList', () => {
    it('returns a single list by id from Dexie', async () => {
      mockDb.seniorityLists.get.mockResolvedValue(mockList1)

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()

      const result = await store.getList(1)

      expect(mockDb.seniorityLists.get).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockList1)
    })

    it('returns undefined when list not found', async () => {
      mockDb.seniorityLists.get.mockResolvedValue(undefined)

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()

      const result = await store.getList(999)

      expect(result).toBeUndefined()
    })
  })

  describe('clearAll', () => {
    it('wipes Dexie tables and resets all store state', async () => {
      mockDb.seniorityLists.clear.mockResolvedValue(undefined)
      mockDb.seniorityEntries.clear.mockResolvedValue(undefined)
      mockDb.seniorityLists.toArray.mockResolvedValue([mockList1])
      mockDb.seniorityEntries.toArray.mockResolvedValue([mockLocalEntry])

      const { useSeniorityStore } = await import('./seniority')
      const store = useSeniorityStore()
      await store.fetchLists()
      await store.fetchEntries(1)

      expect(store.lists).toHaveLength(1)
      expect(store.entries).toHaveLength(1)

      await store.clearAll()

      expect(mockDb.seniorityLists.clear).toHaveBeenCalled()
      expect(mockDb.seniorityEntries.clear).toHaveBeenCalled()
      expect(store.lists).toHaveLength(0)
      expect(store.entries).toHaveLength(0)
      expect(store.currentListId).toBeNull()
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
