import { defineStore } from 'pinia'
import type { SeniorityListResponse, SeniorityEntryResponse } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('seniority-store')

export const useSeniorityStore = defineStore('seniority', () => {
  const lists = ref<SeniorityListResponse[]>([])
  const entries = ref<SeniorityEntryResponse[]>([])
  const listsLoading = ref(false)
  const entriesLoading = ref(false)
  const listsError = ref<string | null>(null)
  const entriesError = ref<string | null>(null)
  const currentListId = ref<string | null>(null)

  function clearStore() {
    lists.value = []
    entries.value = []
    listsLoading.value = false
    entriesLoading.value = false
    listsError.value = null
    entriesError.value = null
    currentListId.value = null
    log.info('Seniority store cleared')
  }

  async function fetchLists() {
    listsLoading.value = true
    listsError.value = null

    try {
      lists.value = await $fetch<SeniorityListResponse[]>('/api/seniority-lists')
      log.debug('Lists fetched', { count: lists.value.length })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch lists'
      log.error('Failed to fetch lists', { error: message })
      listsError.value = message
    }

    listsLoading.value = false
  }

  async function fetchEntries(listId: string) {
    entriesLoading.value = true
    entriesError.value = null
    entries.value = []
    currentListId.value = listId

    try {
      entries.value = await $fetch<SeniorityEntryResponse[]>(`/api/seniority-lists/${listId}/entries`)
      log.debug('Entries fetched', { listId, count: entries.value.length })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch entries'
      log.error('Failed to fetch entries', { listId, error: message })
      entriesError.value = message
    }

    entriesLoading.value = false
  }

  async function updateList(id: string, updates: { title?: string; effective_date?: string }) {
    const updated = await $fetch<SeniorityListResponse>(`/api/seniority-lists/${id}`, {
      method: 'PATCH',
      body: updates,
    })
    const idx = lists.value.findIndex(l => l.id === id)
    if (idx !== -1) lists.value[idx] = updated
    log.info('List updated in store', { listId: id })
  }

  async function deleteList(id: string) {
    await $fetch(`/api/seniority-lists/${id}`, { method: 'DELETE' })
    lists.value = lists.value.filter(l => l.id !== id)
    if (currentListId.value === id) {
      entries.value = []
      currentListId.value = null
    }
    log.info('List deleted from store', { listId: id })
  }

  return {
    lists,
    entries,
    currentListId,
    listsLoading,
    entriesLoading,
    listsError,
    entriesError,
    clearStore,
    fetchLists,
    fetchEntries,
    updateList,
    deleteList,
  }
})
