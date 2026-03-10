import type { SeniorityEntryResponse, SeniorityListResponse } from '#shared/schemas/seniority-list'
import { computeComparison, type CompareResult } from '#shared/utils/seniority-compare'

export function useSeniorityCompare(listIdA: Ref<string | null | undefined>, listIdB: Ref<string | null | undefined>) {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const entriesA = ref<SeniorityEntryResponse[]>([])
  const entriesB = ref<SeniorityEntryResponse[]>([])
  const listMetaA = ref<SeniorityListResponse | null>(null)
  const listMetaB = ref<SeniorityListResponse | null>(null)

  async function fetchListData(listId: string) {
    const [entries, meta] = await Promise.all([
      $fetch<SeniorityEntryResponse[]>(`/api/seniority-lists/${listId}/entries`),
      $fetch<SeniorityListResponse>(`/api/seniority-lists/${listId}`),
    ])
    return { entries, meta }
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
