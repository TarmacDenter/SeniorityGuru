import { defineStore } from 'pinia'
import type { LocalSeniorityList, LocalSeniorityEntry } from '~/utils/db'
import { db } from '~/utils/db'
import { localEntryToSeniorityEntry } from '~/utils/db-adapters'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { createLogger } from '~/utils/logger'
import { emitHook } from '~/utils/hooks'

const log = createLogger('seniority-store')

function compareListsByRecency(a: LocalSeniorityList, b: LocalSeniorityList): number {
  const createdCmp = (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  if (createdCmp !== 0) return createdCmp

  const effectiveCmp = b.effectiveDate.localeCompare(a.effectiveDate)
  if (effectiveCmp !== 0) return effectiveCmp

  return (b.id ?? 0) - (a.id ?? 0)
}

export const useSeniorityStore = defineStore('seniority', () => {
  const lists = ref<LocalSeniorityList[]>([])
  const entries = ref<SeniorityEntry[]>([])
  const listsLoading = ref(false)
  const entriesLoading = ref(false)
  const listsError = ref<string | null>(null)
  const entriesError = ref<string | null>(null)
  const currentListId = ref<number | null>(null)
  const entryCache = new Map<number, SeniorityEntry[]>()

  async function clearAll() {
    await db.seniorityLists.clear()
    await db.seniorityEntries.clear()
    clearStore()
    log.info('All seniority data cleared from Dexie and store')
  }

  function clearStore() {
    lists.value = []
    entries.value = []
    listsLoading.value = false
    entriesLoading.value = false
    listsError.value = null
    entriesError.value = null
    currentListId.value = null
    entryCache.clear()
    log.info('Seniority store cleared')
  }

  async function fetchLists() {
    listsLoading.value = true
    listsError.value = null

    try {
      const raw = await db.seniorityLists.toArray()
      lists.value = raw.sort(compareListsByRecency)
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

  async function addList(
    listData: { title: string | null; effectiveDate: string; isDemo?: boolean },
    entries: Omit<LocalSeniorityEntry, 'id' | 'listId'>[],
  ): Promise<number> {
    const listId = await db.seniorityLists.add({
      title: listData.title,
      effectiveDate: listData.effectiveDate,
      createdAt: new Date().toISOString(),
      ...(listData.isDemo ? { isDemo: true } : {}),
    })

    const localEntries: LocalSeniorityEntry[] = entries.map(e => ({ ...e, listId }))
    await db.seniorityEntries.bulkAdd(localEntries)

    const hasDemoListsBefore = lists.value.some(l => l.isDemo)
    lists.value.push({ id: listId, ...listData, createdAt: new Date().toISOString() })
    lists.value = [...lists.value].sort(compareListsByRecency)
    entryCache.clear()
    log.info('List added', { listId, entryCount: entries.length })
    emitHook('list:added', listId).catch((e: unknown) => {
      log.warn('emitHook list:added failed', { error: String(e) })
    })
    emitHook('list:changed').catch((e: unknown) => {
      log.warn('emitHook list:changed failed', { error: String(e) })
    })
    if (!listData.isDemo && hasDemoListsBefore) {
      emitHook('app:demo:exit').catch((e: unknown) => {
        log.warn('emitHook app:demo:exit failed', { error: String(e) })
      })
    }
    return listId
  }

  async function getEntriesForList(listId: number): Promise<SeniorityEntry[]> {
    const cached = entryCache.get(listId)
    if (cached) return cached

    const localEntries = await db.seniorityEntries.where('listId').equals(listId).toArray()
    const result = localEntries.map(localEntryToSeniorityEntry)
    entryCache.set(listId, result)
    return result
  }

  async function getList(listId: number): Promise<LocalSeniorityList | undefined> {
    return db.seniorityLists.get(listId)
  }

  async function updateList(id: number, updates: { title?: string | null; effectiveDate?: string }) {
    await db.seniorityLists.update(id, updates)
    const idx = lists.value.findIndex(l => l.id === id)
    if (idx !== -1) {
      lists.value[idx] = { ...lists.value[idx]!, ...updates }
      lists.value = [...lists.value].sort(compareListsByRecency)
    }
    log.info('List updated in store', { listId: id })
  }

  async function deleteList(id: number) {
    const wasLastDemoList
      = lists.value.some(l => l.id === id && l.isDemo)
      && lists.value.filter(l => l.isDemo && l.id !== id).length === 0

    await db.deleteList(id)
    lists.value = lists.value.filter(l => l.id !== id)
    entryCache.delete(id)
    if (currentListId.value === id) {
      entries.value = []
      currentListId.value = null
    }
    log.info('List deleted from store', { listId: id })
    emitHook('list:deleted', id).catch((e: unknown) => {
      log.warn('emitHook list:deleted failed', { error: String(e) })
    })
    emitHook('list:changed').catch((e: unknown) => {
      log.warn('emitHook list:changed failed', { error: String(e) })
    })
    if (wasLastDemoList) {
      emitHook('app:demo:exit').catch((e: unknown) => {
        log.warn('emitHook app:demo:exit failed', { error: String(e) })
      })
    }
  }

  /** Deletes all demo lists without emitting app:demo:exit (used by the exit listener). */
  async function deleteDemoLists() {
    const demoLists = lists.value.filter(l => l.isDemo)
    for (const list of demoLists) {
      if (list.id === undefined) continue
      await db.deleteList(list.id)
      entryCache.delete(list.id)
      if (currentListId.value === list.id) {
        entries.value = []
        currentListId.value = null
      }
    }
    lists.value = lists.value.filter(l => !l.isDemo)
    log.info('Demo lists deleted', { count: demoLists.length })
  }

  return {
    lists,
    entries,
    currentListId,
    listsLoading,
    entriesLoading,
    listsError,
    entriesError,
    clearAll,
    clearStore,
    fetchLists,
    fetchEntries,
    addList,
    getEntriesForList,
    getList,
    updateList,
    deleteList,
    deleteDemoLists,
  }
})
