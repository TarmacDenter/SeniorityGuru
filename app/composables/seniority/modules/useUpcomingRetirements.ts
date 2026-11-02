import { createSeniorityAnalysis, type AnchoredSeniorityAnalysis, type QualificationScope, type RelativeUpcomingRetirement, type UpcomingRetirement } from '~/utils/seniority'
import { addYearsDate, diffDateYears } from '~/utils/date'
import { Temporal, todayPlainDate } from '~/utils/temporal'
import { useSeniorityStore } from '~/stores/seniority'
import { useScenario } from '~/composables/useScenario'
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

const DEFAULT_HORIZON_YEARS = 2

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
  const { listAnalysis, analysis, anchoredAnalysis: todayAnchored, hasData, hasAnchor, newHire } = useSeniorityCore()
  const seniorityStore = useSeniorityStore()
  const { qualificationScope: scenarioScope } = useScenario()

  /** The selected list's As-of Date (its effective date); today when no list is selected. */
  const asOfDate = computed(() =>
    seniorityStore.lists.find(list => list.id === seniorityStore.currentListId)?.effectiveDate ?? todayPlainDate())

  /** The Anchor Pilot's analysis as of the As-of Date, so Rank relative to me follows a historical list rather than today. */
  const anchoredAnalysis = computed<AnchoredSeniorityAnalysis | null>(() => {
    const current = todayAnchored.value
    if (!current || Temporal.PlainDate.compare(asOfDate.value, todayPlainDate()) === 0) return current
    return createSeniorityAnalysis({
      entries: seniorityStore.entries,
      modeledEntry: newHire.syntheticEntry.value ?? undefined,
      asOfDate: asOfDate.value,
    }).withAnchor(current.anchor.employee_number)
  })

  /** Whole years from the As-of Date to the last scheduled retirement on the list (at least 1). */
  const horizonMax = computed(() => {
    const start = asOfDate.value
    const last = listAnalysis.value?.catalog.latestRetirementDate
    if (!last || Temporal.PlainDate.compare(last, start) <= 0) return 1
    return Math.max(1, Math.ceil(diffDateYears(start, last)))
  })

  // The pilot's choice; held apart from the range so a shorter list clamps it without losing it.
  const yearsChoice = ref(DEFAULT_HORIZON_YEARS)
  const yearsHorizon = computed<number>({
    get: () => Math.min(Math.max(1, yearsChoice.value), horizonMax.value),
    set: (years) => { yearsChoice.value = years },
  })
  const throughDate = computed(() => addYearsDate(asOfDate.value, yearsHorizon.value))

  const yearsLabel = (years: number) => `${years} ${years === 1 ? 'year' : 'years'}`
  /** Readout text for any year count, so the slider can show its live position before `yearsHorizon` settles. */
  const horizonLabelFor = (years: number) => `${yearsLabel(years)} · through ${addYearsDate(asOfDate.value, years)}`
  const horizonLabel = computed(() => horizonLabelFor(yearsHorizon.value))
  const emptyResultLabel = computed(() =>
    `No pilots match the current filters within ${yearsLabel(yearsHorizon.value)}. Try more years or other filters.`)

  const seniorOnly = ref(true)

  // Qualification Scope: the scenario's until the pilot changes a filter here; then the local
  // override (which may be All) holds the whole scope and the scenario no longer moves it.
  const scopeOverride = ref<QualificationScope | null>(null)
  const qualificationScope = computed<QualificationScope>(() => scopeOverride.value ?? scenarioScope.value)
  const scopeField = (key: keyof QualificationScope) => computed<string | null>({
    get: () => qualificationScope.value[key] ?? null,
    set: (value) => {
      const { [key]: _replaced, ...rest } = qualificationScope.value
      scopeOverride.value = value ? { ...rest, [key]: value } : rest
    },
  })
  const filterBase = scopeField('base')
  const filterSeat = scopeField('seat')
  const filterFleet = scopeField('fleet')
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
      from: asOfDate.value,
      through: throughDate.value,
      qualificationScope: qualificationScope.value,
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
    horizonMax,
    horizonLabel,
    horizonLabelFor,
    emptyResultLabel,
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
