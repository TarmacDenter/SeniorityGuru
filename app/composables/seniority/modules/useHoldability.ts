import type { ComputedRef, Ref } from 'vue'
import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, resultOrNull, type GrowthAssumptions, type PresentedHoldabilityDetail, type QualificationScope } from '~/utils/seniority'
import { useDashboardList } from '~/composables/useDashboardList'
import { useSeniorityCore } from './useSeniorityCore'
import { useStanding, type BaseStatusRow } from './useStanding'
import { useQualificationPositions } from './useQualificationPositions'

/** "now", a Holdable Year ahead, or not before the Anchor Pilot retires. */
export type HoldableStatus = 'now' | 'later' | 'never'

export interface HoldabilityRow extends BaseStatusRow {
  /** Identifies the Qualification for selection. */
  key: string
  /** The Anchor Pilot's own Qualification, marked like their line in the list. */
  isAnchor: boolean
  holdableLabel: string
  holdableStatus: HoldableStatus
  /** Set when the Anchor Pilot is junior to the Qualification's most junior active pilot today. */
  thresholdRelationLabel: string | null
}

export interface HoldabilitySeatGroup {
  seat: string
  seatLabel: string
  /** Names Hypothetical Placement once for the seat's table; null when the Anchor Pilot is in every row. */
  hypotheticalLabel: string | null
  rows: HoldabilityRow[]
}

export interface HoldabilityDetailView extends PresentedHoldabilityDetail {
  holdableLabel: string
}

/** Rank is today's: it already drops pilots who retired since the list was published. */
const COLUMN_LABELS = {
  qualification: 'Qualification',
  rank: 'Today\'s Rank',
  rosterSize: 'Roster Size',
  percentile: 'Seniority Percentile',
  status: 'Holdable',
} as const

function keyOf(qualification: { base: string, seat: string, fleet: string }): string {
  return `${qualification.fleet} ${qualification.seat} ${qualification.base}`
}

function seatHypotheticalLabel(group: { seatLabel: string, rows: { hypotheticalLabel: string | null }[] }): string | null {
  const hypothetical = group.rows.filter(row => row.hypotheticalLabel).length
  if (hypothetical === 0) return null
  return `Hypothetical Placement in ${hypothetical === group.rows.length ? 'all' : 'the other'} ${group.seatLabel} Qualifications`
}

/**
 * Current › Holdability: every Qualification with today's Rank and its Holdable Year, and the selected
 * Qualification's detail series. Holdable Year is measured from the As-of Date, so Project forward does not move it.
 */
export function useHoldability(
  qualificationScope?: Ref<QualificationScope> | ComputedRef<QualificationScope>,
  growthAssumptions?: Ref<GrowthAssumptions>,
) {
  const { selectedListId } = useDashboardList()
  const juniorCaptainsLink = computed(() => `/dashboard/demographics${selectedListId.value ? `?list=${selectedListId.value}` : ''}#junior-captains`)
  const assumptions = growthAssumptions ?? ref<GrowthAssumptions>({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS })
  const { anchoredAnalysis } = useSeniorityCore()
  const { rankCard, qualificationGroups } = useStanding(qualificationScope)
  const scale = useQualificationPositions(assumptions)

  const positionsByKey = computed(() => new Map(scale.positions.value.map(position => [position.qualificationLabel, position])))

  const groups = computed<HoldabilitySeatGroup[]>(() => qualificationGroups.value.map(group => ({
    ...group,
    hypotheticalLabel: seatHypotheticalLabel(group),
    rows: group.rows.flatMap((row) => {
      const key = keyOf(row)
      const position = positionsByKey.value.get(key)
      if (!position) return []
      const holdableStatus: HoldableStatus = position.holdableYear === 'now'
        ? 'now'
        : position.holdableYear === null ? 'never' : 'later'
      return [{
        ...row,
        key,
        isAnchor: row.isAnchorCurrentQualification,
        holdableLabel: position.holdableLabel,
        holdableStatus,
        thresholdRelationLabel: position.thresholdRelationLabel,
      }]
    }),
  })))

  /** One seat at a time keeps the view to about one screen; it starts on the Anchor Pilot's seat. */
  const seatOptions = computed(() => groups.value.map(group => ({ label: group.seatLabel, value: group.seat })))
  const chosenSeat = ref<string | null>(null)
  const selectedSeat = computed<string | null>({
    get: () => {
      const seats = seatOptions.value.map(option => option.value)
      if (chosenSeat.value && seats.includes(chosenSeat.value)) return chosenSeat.value
      const anchorSeat = anchoredAnalysis.value?.anchor.seat
      return anchorSeat && seats.includes(anchorSeat) ? anchorSeat : seats[0] ?? null
    },
    set: (seat) => { chosenSeat.value = seat },
  })
  const visibleGroups = computed(() => groups.value.filter(group => group.seat === selectedSeat.value))

  const selectedKey = ref<string | null>(null)
  function select(key: string) {
    selectedKey.value = selectedKey.value === key ? null : key
  }

  const detail = computed<HoldabilityDetailView | null>(() => {
    const position = selectedKey.value ? positionsByKey.value.get(selectedKey.value) : undefined
    if (!position || !anchoredAnalysis.value) return null
    const presented = resultOrNull(anchoredAnalysis.value.holdabilityDetail({
      qualification: position.qualification,
      growthAssumptions: assumptions.value,
    }).presentation)
    return presented ? { ...presented, holdableLabel: position.holdableLabel } : null
  })

  const noResultLabel = computed(() => rankCard.value.noResultLabel ?? scale.noResultLabel.value)

  return {
    columnLabels: COLUMN_LABELS,
    juniorCaptainsLink,
    groups,
    seatOptions,
    selectedSeat,
    visibleGroups,
    noResultLabel,
    selectedKey,
    select,
    detail,
  }
}
