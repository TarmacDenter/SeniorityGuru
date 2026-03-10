import type { Tables } from '#shared/types/database'
import { computeComparison } from '#shared/utils/seniority-compare'
export type { RetiredPilot, DepartedPilot, QualMove, RankChange, NewHire, CompareResult } from '#shared/utils/seniority-compare'

type Entry = Tables<'seniority_entries'>
type List = Tables<'seniority_lists'>

export function useSeniorityCompare(listIdA: Ref<string | null | undefined>, listIdB: Ref<string | null | undefined>) {
  const db = useDb()

  const loading = ref(false)
  const error = ref<string | null>(null)

  const entriesA = ref<Entry[]>([])
  const entriesB = ref<Entry[]>([])
  const listMetaA = ref<List | null>(null)
  const listMetaB = ref<List | null>(null)

  async function fetchListData(listId: string) {
    const [entries, metaResult] = await Promise.all([
      fetchAllRows(db, 'seniority_entries', q =>
        q.select('*').eq('list_id', listId).order('seniority_number'),
      ),
      db.from('seniority_lists').select('*').eq('id', listId).single(),
    ])
    if (metaResult.error) throw new Error(metaResult.error.message)
    return { entries, meta: metaResult.data }
  }

  const comparison = computed<CompareResult | null>(() => {
    if (!entriesA.value.length || !entriesB.value.length || !listMetaA.value || !listMetaB.value) {
      return null
    }

    return computeComparison(
      entriesA.value,
      entriesB.value,
      listMetaB.value.effective_date,
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
    catch (e: any) {
      error.value = e.message
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
