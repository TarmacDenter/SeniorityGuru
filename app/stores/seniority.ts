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
    // Call useDb() inside action, not at module level (Nuxt composable rule)
    const db = useDb()

    listsLoading.value = true
    listsError.value = null

    const { data, error } = await db
      .from('seniority_lists')
      .select('*')
      .order('effective_date', { ascending: false })

    if (error) {
      listsError.value = error.message
    } else {
      lists.value = data ?? []
    }

    listsLoading.value = false
  }

  async function fetchEntries(listId: string) {
    // Call useDb() inside action, not at module level (Nuxt composable rule)
    const db = useDb()

    entriesLoading.value = true
    entriesError.value = null
    entries.value = []

    const { data, error } = await db
      .from('seniority_entries')
      .select('*')
      .eq('list_id', listId)
      .order('seniority_number', { ascending: true })

    if (error) {
      entriesError.value = error.message
    } else {
      entries.value = data ?? []
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
