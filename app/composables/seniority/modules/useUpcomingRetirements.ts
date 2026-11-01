import type { RelativeUpcomingRetirement, UpcomingRetirement } from '~/utils/seniority'
import { addYearsDate } from '~/utils/date'
import { Temporal, todayPlainDate } from '~/utils/temporal'
import { useSeniorityCore } from './useSeniorityCore'

export type RetirementSortKey = 'retirementDate' | 'seniorityNumber' | 'rankRelativeToMe'
export type RetirementSortDir = 'asc' | 'desc'

/** One scheduled retirement with display text ready to render. */
export interface RetirementRow {
  key: string
  seniorityNumber: number
  qualificationLabel: string
  retirementDateLabel: string
  /** Signed Rank difference to the Anchor Pilot (`+3` is senior); null without an Anchor Pilot. */
  relativeLabel: string | null
}

export interface RetirementFilterItem { label: string; value: string | null }

export const RETIREMENT_HORIZONS = [
  { label: '1 year', value: 1 },
  { label: '2 years', value: 2 },
  { label: '3 years', value: 3 },
  { label: '5 years', value: 5 },
]

type Raw = UpcomingRetirement | RelativeUpcomingRetirement

function relativeOf(row: Raw): number | null {
  return 'positionsSeniorToAnchor' in row ? row.positionsSeniorToAnchor : null
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

function filterItems(allLabel: string, values: readonly string[] | undefined): RetirementFilterItem[] {
  return [{ label: allLabel, value: null }, ...(values ?? []).map(value => ({ label: value, value }))]
}

/**
 * The Retirements table of the Lists panel: scheduled retirements inside a horizon, filtered by
 * Qualification and (with an Anchor Pilot) by seniority, sorted, with display text ready to render.
 */
export function useUpcomingRetirements() {
  const { listAnalysis, analysis, anchoredAnalysis, hasData, hasAnchor } = useSeniorityCore()

  const yearsHorizon = ref(2)
  const seniorOnly = ref(true)
  const filterBase = ref<string | null>(null)
  const filterSeat = ref<string | null>(null)
  const filterFleet = ref<string | null>(null)
  const sortKey = ref<RetirementSortKey>('retirementDate')
  const sortDir = ref<RetirementSortDir>('asc')

  function toggleSort(key: RetirementSortKey) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
      return
    }
    sortKey.value = key
    sortDir.value = 'asc'
  }

  const baseItems = computed(() => filterItems('All bases', listAnalysis.value?.catalog.bases))
  const seatItems = computed(() => filterItems('All seats', listAnalysis.value?.catalog.seats))
  const fleetItems = computed(() => filterItems('All fleets', listAnalysis.value?.catalog.fleets))

  const rows = computed<RetirementRow[]>(() => {
    if (!hasData.value || !analysis.value) return []
    const filter = {
      through: addYearsDate(todayPlainDate(), yearsHorizon.value),
      qualificationScope: {
        ...(filterBase.value && { base: filterBase.value }),
        ...(filterSeat.value && { seat: filterSeat.value }),
        ...(filterFleet.value && { fleet: filterFleet.value }),
      },
    }
    const raw: readonly Raw[] = anchoredAnalysis.value
      ? anchoredAnalysis.value.relativeUpcomingRetirements({ ...filter, seniorOnly: seniorOnly.value })
      : analysis.value.upcomingRetirements(filter)

    const direction = sortDir.value === 'asc' ? 1 : -1
    const compare = (a: Raw, b: Raw) => {
      if (sortKey.value === 'seniorityNumber') return a.seniorityNumber - b.seniorityNumber
      if (sortKey.value === 'rankRelativeToMe') return (relativeOf(a) ?? 0) - (relativeOf(b) ?? 0)
      return Temporal.PlainDate.compare(a.retirementDate, b.retirementDate)
    }

    return [...raw].sort((a, b) => direction * compare(a, b)).map((row) => {
      const relative = relativeOf(row)
      return {
        key: `${row.employeeNumber}-${row.seniorityNumber}`,
        seniorityNumber: row.seniorityNumber,
        qualificationLabel: `${row.qualification.base} · ${row.qualification.seat} / ${row.qualification.fleet}`,
        retirementDateLabel: row.retirementDate.toString(),
        relativeLabel: relative === null ? null : signed(relative),
      }
    })
  })

  return {
    hasData,
    hasAnchor,
    yearsHorizon,
    seniorOnly,
    filterBase,
    filterSeat,
    filterFleet,
    baseItems,
    seatItems,
    fleetItems,
    sortKey,
    sortDir,
    toggleSort,
    rows,
  }
}
