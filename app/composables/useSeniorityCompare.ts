import type { Tables } from '#shared/types/database'

type Entry = Tables<'seniority_entries'>
type List = Tables<'seniority_lists'>

export interface RetiredPilot {
  employee_number: string
  name: string | null
  seniority_number: number
  retire_date: string
}

export interface DepartedPilot {
  employee_number: string
  name: string | null
  seniority_number: number
  retire_date: string | null
}

export interface QualMove {
  employee_number: string
  name: string | null
  seniority_number: number
  old_seat: string | null
  new_seat: string | null
  old_fleet: string | null
  new_fleet: string | null
  old_base: string | null
  new_base: string | null
}

export interface RankChange {
  employee_number: string
  name: string | null
  old_rank: number
  new_rank: number
  delta: number
}

export interface NewHire {
  employee_number: string
  name: string | null
  seniority_number: number
  hire_date: string
}

export interface CompareResult {
  retired: RetiredPilot[]
  departed: DepartedPilot[]
  qualMoves: QualMove[]
  rankChanges: RankChange[]
  newHires: NewHire[]
}

export function computeComparison(
  olderEntries: Entry[],
  newerEntries: Entry[],
  newerEffectiveDate: string,
): CompareResult {
  const olderMap = new Map<string, Entry>()
  for (const e of olderEntries) olderMap.set(e.employee_number, e)

  const newerMap = new Map<string, Entry>()
  for (const e of newerEntries) newerMap.set(e.employee_number, e)

  const retired: RetiredPilot[] = []
  const departed: DepartedPilot[] = []
  const qualMoves: QualMove[] = []
  const rankChanges: RankChange[] = []
  const newHires: NewHire[] = []

  // Pilots in older list but not in newer
  for (const [empNum, old] of olderMap) {
    if (!newerMap.has(empNum)) {
      if (old.retire_date && old.retire_date <= newerEffectiveDate) {
        retired.push({
          employee_number: empNum,
          name: old.name,
          seniority_number: old.seniority_number,
          retire_date: old.retire_date,
        })
      }
      else {
        departed.push({
          employee_number: empNum,
          name: old.name,
          seniority_number: old.seniority_number,
          retire_date: old.retire_date,
        })
      }
    }
  }

  // Pilots in both lists
  for (const [empNum, newer] of newerMap) {
    const older = olderMap.get(empNum)
    if (!older) continue

    // Qual moves: seat, fleet, or base changed
    if (older.seat !== newer.seat || older.fleet !== newer.fleet || older.base !== newer.base) {
      qualMoves.push({
        employee_number: empNum,
        name: newer.name,
        seniority_number: newer.seniority_number,
        old_seat: older.seat,
        new_seat: newer.seat,
        old_fleet: older.fleet,
        new_fleet: newer.fleet,
        old_base: older.base,
        new_base: newer.base,
      })
    }

    // Rank changes
    if (older.seniority_number !== newer.seniority_number) {
      rankChanges.push({
        employee_number: empNum,
        name: newer.name,
        old_rank: older.seniority_number,
        new_rank: newer.seniority_number,
        delta: older.seniority_number - newer.seniority_number,
      })
    }
  }

  // New hires: in newer but not in older
  for (const [empNum, entry] of newerMap) {
    if (!olderMap.has(empNum)) {
      newHires.push({
        employee_number: empNum,
        name: entry.name,
        seniority_number: entry.seniority_number,
        hire_date: entry.hire_date,
      })
    }
  }

  return { retired, departed, qualMoves, rankChanges, newHires }
}

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

    // Respect the user's selection: A is always older, B is always newer
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
