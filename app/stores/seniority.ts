import { defineStore } from 'pinia'
import type { Tables } from '#shared/types/database'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('seniority-store')

export const useSeniorityStore = defineStore('seniority', () => {
  const lists = ref<Tables<'seniority_lists'>[]>([])
  const entries = ref<Tables<'seniority_entries'>[]>([])
  const listsLoading = ref(false)
  const entriesLoading = ref(false)
  const listsError = ref<string | null>(null)
  const entriesError = ref<string | null>(null)

  async function fetchLists() {
    const db = useDb()

    listsLoading.value = true
    listsError.value = null

    try {
      lists.value = await fetchAllRows(db, 'seniority_lists', q =>
        q.select('*').order('effective_date', { ascending: false }),
      )
      log.debug('Lists fetched', { count: lists.value.length })
    } catch (e: any) {
      log.error('Failed to fetch lists', { error: e.message })
      listsError.value = e.message
    }

    listsLoading.value = false
  }

  async function fetchEntries(listId: string) {
    const db = useDb()

    entriesLoading.value = true
    entriesError.value = null
    entries.value = []
    currentListId.value = listId

    try {
      entries.value = await fetchAllRows(db, 'seniority_entries', q =>
        q.select('*').eq('list_id', listId).order('seniority_number', { ascending: true }),
      )
      log.debug('Entries fetched', { listId, count: entries.value.length })
    } catch (e: any) {
      log.error('Failed to fetch entries', { listId, error: e.message })
      entriesError.value = e.message
    }

    entriesLoading.value = false
  }

  /** Track which list's entries are currently loaded */
  const currentListId = ref<string | null>(null)

  async function updateList(id: string, updates: { airline?: string; effective_date?: string }) {
    const updated = await $fetch<Tables<'seniority_lists'>>(`/api/seniority-lists/${id}`, {
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
    fetchLists,
    fetchEntries,
    updateList,
    deleteList,
  }
})
