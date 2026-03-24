import { defineStore } from 'pinia'
import type { LocalSeniorityList } from '~/utils/db'
import { db } from '~/utils/db'
import { localEntryToSeniorityEntry } from '~/utils/db-adapters'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { createLogger } from '~/utils/logger'

const log = createLogger('seniority-store')

export const useSeniorityStore = defineStore('seniority', () => {
  const lists = ref<LocalSeniorityList[]>([])
  const entries = ref<SeniorityEntry[]>([])
  const listsLoading = ref(false)
  const entriesLoading = ref(false)
  const listsError = ref<string | null>(null)
  const entriesError = ref<string | null>(null)
  const currentListId = ref<number | null>(null)

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
      lists.value = await db.seniorityLists.orderBy('effectiveDate').reverse().toArray()
      log.debug('Lists fetched', { count: lists.value.length })
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch lists'
      log.error('Failed to fetch lists', { error: message })
      listsError.value = message
    }

    listsLoading.value = false
  }

  async function fetchEntries(listId: number) {
    entriesLoading.value = true
    entriesError.value = null
    entries.value = []
    currentListId.value = listId

    try {
      const localEntries = await db.seniorityEntries.where('listId').equals(listId).toArray()
      entries.value = localEntries.map(localEntryToSeniorityEntry)
      log.debug('Entries fetched', { listId, count: entries.value.length })
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch entries'
      log.error('Failed to fetch entries', { listId, error: message })
      entriesError.value = message
    }

    entriesLoading.value = false
  }

  async function updateList(id: number, updates: { title?: string | null; effectiveDate?: string }) {
    await db.seniorityLists.update(id, updates)
    const idx = lists.value.findIndex(l => l.id === id)
    if (idx !== -1) {
      lists.value[idx] = { ...lists.value[idx]!, ...updates }
    }
    log.info('List updated in store', { listId: id })
  }

  async function deleteList(id: number) {
    await db.deleteList(id)
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
