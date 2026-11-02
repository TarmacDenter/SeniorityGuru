import type { SeniorityList } from '~/utils/db'
import { formatInstantLocal, serializePlainDate } from '~/utils/temporal'
import { useSeniorityStore } from '~/stores/seniority'

export type SeniorityListSummary = SeniorityList

/** One line of the Recent Lists timeline on List › Uploads. */
export interface RecentListItem {
  id: number
  title: string
  description: string
  icon: string
  date: string
}

const RECENT_LIST_COUNT = 5

export function useSeniorityLists() {
  const store = useSeniorityStore()

  const lists = computed<SeniorityListSummary[]>(() => store.lists)
  const listsLoading = computed(() => store.listsLoading)
  const listsError = computed(() => store.listsError)
  const entriesLoading = computed(() => store.entriesLoading)

  const listOptions = computed(() =>
    store.lists.map((l: SeniorityList) => ({
      label: l.title ? `${l.title} — ${serializePlainDate(l.effectiveDate)}` : serializePlainDate(l.effectiveDate),
      value: l.id,
    })),
  )

  const listCountLabel = computed(() => store.lists.length.toLocaleString())

  // The latest uploads, newest first, named by title or Effective Date.
  const recentLists = computed<RecentListItem[]>(() => [...store.lists]
    .filter((l: SeniorityList) => l.id != null)
    .sort((a: SeniorityList, b: SeniorityList) => b.createdAt.epochMilliseconds - a.createdAt.epochMilliseconds)
    .slice(0, RECENT_LIST_COUNT)
    .map((l: SeniorityList) => ({
      id: l.id!,
      title: l.title || serializePlainDate(l.effectiveDate),
      description: `Effective ${serializePlainDate(l.effectiveDate)}`,
      icon: 'i-lucide-file-text',
      date: formatInstantLocal(l.createdAt),
    })))

  async function fetchLists() {
    await store.fetchLists()
  }

  async function deleteList(id: number) {
    await store.deleteList(id)
  }

  async function updateList(id: number, updates: { title?: string | null; effectiveDate?: import('~/utils/temporal').PlainDate }) {
    await store.updateList(id, updates)
  }

  async function fetchEntries(listId: number) {
    await store.fetchEntries(listId)
  }

  function clearStore() {
    store.clearStore()
  }

  return { lists, listsLoading, listsError, entriesLoading, listOptions, listCountLabel, recentLists, fetchLists, deleteList, updateList, fetchEntries, clearStore }
}
