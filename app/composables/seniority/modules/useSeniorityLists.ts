import type { LocalSeniorityList } from '~/utils/db'
import { useSeniorityStore } from '~/stores/seniority'

export function useSeniorityLists() {
  const store = useSeniorityStore()

  const lists = computed(() => store.lists)
  const listsLoading = computed(() => store.listsLoading)
  const listsError = computed(() => store.listsError)
  const entriesLoading = computed(() => store.entriesLoading)

  const listOptions = computed(() =>
    store.lists.map((l: LocalSeniorityList) => ({
      label: l.title ? `${l.title} — ${l.effectiveDate}` : l.effectiveDate,
      value: l.id,
    })),
  )

  async function fetchLists() {
    await store.fetchLists()
  }

  async function deleteList(id: number) {
    await store.deleteList(id)
  }

  async function updateList(id: number, updates: { title?: string | null; effectiveDate?: string }) {
    await store.updateList(id, updates)
  }

  async function fetchEntries(listId: number) {
    await store.fetchEntries(listId)
  }

  function clearStore() {
    store.clearStore()
  }

  return { lists, listsLoading, listsError, entriesLoading, listOptions, fetchLists, deleteList, updateList, fetchEntries, clearStore }
}
