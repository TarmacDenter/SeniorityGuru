import { defineStore } from 'pinia'
import type { Tables } from '#shared/types/database'

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
    } catch (e: any) {
      listsError.value = e.message
    }

    listsLoading.value = false
  }

  async function fetchEntries(listId: string) {
    const db = useDb()

    entriesLoading.value = true
    entriesError.value = null
    entries.value = []

    try {
      entries.value = await fetchAllRows(db, 'seniority_entries', q =>
        q.select('*').eq('list_id', listId).order('seniority_number', { ascending: true }),
      )
    } catch (e: any) {
      entriesError.value = e.message
    }

    entriesLoading.value = false
  }

  return {
    lists,
    entries,
    listsLoading,
    entriesLoading,
    listsError,
    entriesError,
    fetchLists,
    fetchEntries,
  }
})
