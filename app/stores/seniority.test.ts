import { describe, it, expect, beforeEach } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { useSeniorityStore } from './seniority'
import type { SeniorityListResponse, SeniorityEntryResponse } from '#shared/schemas/seniority-list'

const mockList: SeniorityListResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  airline: 'DAL',
  title: 'January List',
  effective_date: '2026-01-15',
  created_at: '2026-01-10T12:00:00Z',
}

const mockList2: SeniorityListResponse = {
  id: '660e8400-e29b-41d4-a716-446655440000',
  airline: 'DAL',
  title: null,
  effective_date: '2026-02-15',
  created_at: '2026-02-10T12:00:00Z',
}

const mockEntry: SeniorityEntryResponse = {
  id: 'aaa00000-0000-0000-0000-000000000001',
  list_id: '550e8400-e29b-41d4-a716-446655440000',
  seniority_number: 1,
  employee_number: '12345',
  name: 'Smith, John',
  seat: 'CA',
  base: 'JFK',
  fleet: '737',
  hire_date: '2010-01-15',
  retire_date: '2035-06-15',
}

describe('seniority store', () => {
  beforeEach(() => {
    const store = useSeniorityStore()
    store.lists = []
    store.entries = []
    store.listsError = null
    store.entriesError = null
    store.currentListId = null
  })

  describe('fetchLists', () => {
    it('calls $fetch and populates lists', async () => {
      registerEndpoint('/api/seniority-lists', () => [mockList, mockList2])

      const store = useSeniorityStore()
      await store.fetchLists()

      expect(store.lists).toHaveLength(2)
      expect(store.lists[0]!.id).toBe(mockList.id)
      expect(store.lists[1]!.id).toBe(mockList2.id)
    })

    it('sets listsError on failure', async () => {
      registerEndpoint('/api/seniority-lists', () => {
        throw createError({ statusCode: 500, statusMessage: 'Server Error' })
      })

      const store = useSeniorityStore()
      await store.fetchLists()

      expect(store.listsError).toBeTruthy()
      expect(store.lists).toHaveLength(0)
    })
  })

  describe('fetchEntries', () => {
    it('calls $fetch and populates entries', async () => {
      const listId = '550e8400-e29b-41d4-a716-446655440000'
      registerEndpoint(`/api/seniority-lists/${listId}/entries`, () => [mockEntry])

      const store = useSeniorityStore()
      await store.fetchEntries(listId)

      expect(store.entries).toHaveLength(1)
      expect(store.entries[0]!.employee_number).toBe('12345')
      expect(store.currentListId).toBe(listId)
    })

    it('sets entriesError on failure', async () => {
      const listId = '550e8400-e29b-41d4-a716-446655440000'
      registerEndpoint(`/api/seniority-lists/${listId}/entries`, () => {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
      })

      const store = useSeniorityStore()
      await store.fetchEntries(listId)

      expect(store.entriesError).toBeTruthy()
      expect(store.entries).toHaveLength(0)
    })
  })

  describe('updateList', () => {
    it('calls PATCH and updates list in store', async () => {
      const updatedList = { ...mockList, title: 'Updated Title' }
      registerEndpoint(`/api/seniority-lists/${mockList.id}`, {
        method: 'PATCH',
        handler: () => updatedList,
      })

      const store = useSeniorityStore()
      store.lists = [mockList, mockList2]

      await store.updateList(mockList.id, { title: 'Updated Title' })

      expect(store.lists[0]!.title).toBe('Updated Title')
    })
  })

  describe('clearStore', () => {
    it('resets lists and entries to empty arrays', () => {
      const store = useSeniorityStore()
      store.lists = [mockList, mockList2]
      store.entries = [mockEntry]
      store.currentListId = mockList.id

      store.clearStore()

      expect(store.lists).toHaveLength(0)
      expect(store.entries).toHaveLength(0)
      expect(store.currentListId).toBeNull()
    })

    it('resets all loading and error state', () => {
      const store = useSeniorityStore()
      store.listsError = 'some error'
      store.entriesError = 'another error'

      store.clearStore()

      expect(store.listsLoading).toBe(false)
      expect(store.entriesLoading).toBe(false)
      expect(store.listsError).toBeNull()
      expect(store.entriesError).toBeNull()
    })

    // Regression: Array.slice() was used instead of reassignment — it's a no-op
    it('actually empties arrays (not a no-op)', () => {
      const store = useSeniorityStore()
      store.lists = [mockList]
      store.entries = [mockEntry]

      store.clearStore()

      expect(store.lists).toHaveLength(0)
      expect(store.entries).toHaveLength(0)
    })
  })

  describe('deleteList', () => {
    it('calls DELETE and removes list from store', async () => {
      registerEndpoint(`/api/seniority-lists/${mockList.id}`, {
        method: 'DELETE',
        handler: () => null,
      })

      const store = useSeniorityStore()
      store.lists = [mockList, mockList2]
      store.currentListId = mockList.id
      store.entries = [mockEntry]

      await store.deleteList(mockList.id)

      expect(store.lists).toHaveLength(1)
      expect(store.lists[0]!.id).toBe(mockList2.id)
      expect(store.entries).toHaveLength(0)
      expect(store.currentListId).toBeNull()
    })
  })
})
