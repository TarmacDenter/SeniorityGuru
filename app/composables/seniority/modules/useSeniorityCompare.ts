import type { LocalSeniorityList } from '~/utils/db'
import { useSeniorityStore } from '~/stores/seniority'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { computeComparison, type CompareResult } from '~/utils/seniority-compare'

export function useSeniorityCompare(listIdA: Ref<number | null | undefined>, listIdB: Ref<number | null | undefined>) {
  const store = useSeniorityStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const entriesA = ref<SeniorityEntry[]>([])
  const entriesB = ref<SeniorityEntry[]>([])
  const listMetaA = ref<LocalSeniorityList | null>(null)
  const listMetaB = ref<LocalSeniorityList | null>(null)

  async function fetchListData(listId: number) {
    const [entries, meta] = await Promise.all([
      store.getEntriesForList(listId),
      store.getList(listId),
    ])
    return { entries, meta: meta ?? null }
  }

  const comparison = computed<CompareResult | null>(() => {
    if (!entriesA.value.length || !entriesB.value.length || !listMetaA.value || !listMetaB.value) {
      return null
    }

    return computeComparison(
      entriesA.value,
      entriesB.value,
      listMetaB.value.effectiveDate,
    )
  })

  async function loadComparison() {
    const idA = listIdA.value
    const idB = listIdB.value
    if (!idA || !idB || idA === idB) return

    loading.value = true
    error.value = null

    try {
      const [dataA, dataB] = await Promise.all([
        fetchListData(idA),
        fetchListData(idB),
      ])
      entriesA.value = dataA.entries
      entriesB.value = dataB.entries
      listMetaA.value = dataA.meta
      listMetaB.value = dataB.meta
    }
    catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load comparison'
    }
    finally {
      loading.value = false
    }
  }

  watch([listIdA, listIdB], () => loadComparison(), { immediate: true })

  return {
    loading,
    error,
    comparison,
    listMetaA,
    listMetaB,
    loadComparison,
  }
}
