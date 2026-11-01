import type { ComputedRef, Ref } from 'vue'
import { isNoResult, type QualificationScope } from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

export interface RankCardData {
  seniorityNumber: number
  /** Rank-dependent figures are null when no Rank exists (retired Anchor Pilot or no data); never zero-filled. */
  rank: number | null
  publicationPosition: number | null
  rosterSize: number | null
  /** Real pilots in the scope; excludes the modeled New Hire pilot. */
  publicationPilotCount: number | null
  activePilotCount: number | null
  isSimulated: boolean
  seniorityPercentile: number | null
  base: string
  seat: string
  fleet: string
  hireDate: string
  /** Why no Rank is available, e.g. "Anchor Pilot retired"; null when a Rank exists. */
  noResultLabel: string | null
  /** "Hypothetical Placement in <scope>" when you are not in the selected scope; null otherwise. */
  hypotheticalLabel: string | null
  /** "Roster Size N · Active pilots M"; null when no Rank exists, so the view shows a placeholder. */
  rosterSummaryLabel: string | null
  /** "Percentile measured against Roster Size N · Active pilots M"; null when no Rank exists. */
  percentileScaleLabel: string | null
}

const PLACEHOLDER = '--'

function emptyRankCard(overrides: Partial<RankCardData> = {}): RankCardData {
  return {
    seniorityNumber: 0,
    rank: null,
    publicationPosition: null,
    rosterSize: null,
    publicationPilotCount: null,
    activePilotCount: null,
    isSimulated: false,
    seniorityPercentile: null,
    base: PLACEHOLDER,
    seat: PLACEHOLDER,
    fleet: PLACEHOLDER,
    hireDate: PLACEHOLDER,
    noResultLabel: null,
    hypotheticalLabel: null,
    rosterSummaryLabel: null,
    percentileScaleLabel: null,
    ...overrides,
  }
}

export interface BaseStatusRow {
  base: string
  seat: string
  fleet: string
  rank: number
  publicationPosition: number
  rosterSize: number
  activePilotCount: number
  seniorityPercentile: number
  isAnchorCurrentQualification: boolean
  /** "Hypothetical Placement in <qualification>" for qualifications you are not in; null for your own. */
  hypotheticalLabel: string | null
  /** Display text, formatted by the analysis presentation: "JFK 737", "12", "of 480", "62.4%", "Captain". */
  baseFleetLabel: string
  rankLabel: string
  rosterOfLabel: string
  percentileLabel: string
  seatLabel: string
}

/** One seat's Qualifications, highest Seniority Percentile first. */
export interface QualificationSeatGroup {
  seat: string
  seatLabel: string
  rows: BaseStatusRow[]
}

/** A headline figure on Current › Status; value is a placeholder when no figure exists. */
export interface StandingFigure {
  label: string
  value: string
  /** Trend or context shown beside the value, e.g. "42 senior to you"; absent when there is none. */
  note?: string
}

const SEAT_ORDER: Record<string, number> = { CA: 0, FO: 1 }

export function useStanding(qualificationScope?: Ref<QualificationScope> | ComputedRef<QualificationScope>): {
  rankCard: ComputedRef<RankCardData>
  baseStatus: ComputedRef<BaseStatusRow[]>
  qualificationGroups: ComputedRef<QualificationSeatGroup[]>
  figures: ComputedRef<StandingFigure[]>
} {
  const { anchoredAnalysis } = useSeniorityCore()

  const anchorEntry = computed(() => anchoredAnalysis.value?.anchor)
  const rawStandingOutput = computed(() => anchoredAnalysis.value?.seniorityStanding({
    scenario: { qualificationScope: qualificationScope?.value ?? {} },
  }) ?? null)
  const standingNoResult = computed(() => {
    const domain = rawStandingOutput.value?.domain
    return domain && isNoResult(domain) ? domain : null
  })
  const standingOutput = computed(() => {
    const output = rawStandingOutput.value
    if (!output || isNoResult(output.domain) || isNoResult(output.presentation)) return null
    return { domain: output.domain, presentation: output.presentation }
  })
  const standingResult = computed(() => standingOutput.value?.domain ?? null)

  const rankCard = computed<RankCardData>(() => {
    const entry = anchorEntry.value
    const standing = standingResult.value
    if (entry && !standing && standingNoResult.value) {
      return emptyRankCard({
        seniorityNumber: entry.seniority_number,
        base: entry.base ?? PLACEHOLDER,
        seat: entry.seat ?? PLACEHOLDER,
        fleet: entry.fleet ?? PLACEHOLDER,
        hireDate: entry.hire_date.toString(),
        noResultLabel: standingNoResult.value.label,
      })
    }
    if (!entry || !standing) return emptyRankCard()
    return {
      seniorityNumber: entry.seniority_number,
      rank: standing.rank,
      publicationPosition: standing.publicationPosition,
      rosterSize: standing.rosterSize,
      publicationPilotCount: standing.publicationPilotCount,
      activePilotCount: standing.activePilotCount,
      isSimulated: standing.isModeled,
      seniorityPercentile: standing.seniorityPercentile,
      base: entry.base ?? PLACEHOLDER,
      seat: entry.seat ?? PLACEHOLDER,
      fleet: entry.fleet ?? PLACEHOLDER,
      hireDate: entry.hire_date.toString(),
      noResultLabel: null,
      hypotheticalLabel: standingOutput.value?.presentation.hypotheticalLabel ?? null,
      rosterSummaryLabel: standingOutput.value?.presentation.rosterSummaryLabel ?? null,
      percentileScaleLabel: standingOutput.value?.presentation.percentileScaleLabel ?? null,
    }
  })

  const baseStatus = computed<BaseStatusRow[]>(() => {
    const presented = standingOutput.value?.presentation
    if (!presented) return []
    return presented.qualificationStandings.map(row => ({
      base: row.qualification.base,
      seat: row.qualification.seat,
      fleet: row.qualification.fleet,
      rank: row.rank,
      publicationPosition: row.publicationPosition,
      rosterSize: row.rosterSize,
      activePilotCount: row.activePilotCount,
      seniorityPercentile: row.seniorityPercentile,
      isAnchorCurrentQualification: row.isAnchorCurrentQualification,
      hypotheticalLabel: row.hypotheticalLabel,
      baseFleetLabel: row.baseFleetLabel,
      rankLabel: row.rankLabel,
      rosterOfLabel: row.rosterOfLabel,
      percentileLabel: row.percentileLabel,
      seatLabel: row.seatLabel,
    }))
  })

  const qualificationGroups = computed<QualificationSeatGroup[]>(() => {
    const bySeat = new Map<string, BaseStatusRow[]>()
    for (const row of baseStatus.value) bySeat.set(row.seat, [...(bySeat.get(row.seat) ?? []), row])
    return [...bySeat.entries()]
      .sort(([a], [b]) => (SEAT_ORDER[a] ?? 99) - (SEAT_ORDER[b] ?? 99) || a.localeCompare(b))
      .map(([seat, rows]) => ({
        seat,
        seatLabel: rows[0]!.seatLabel,
        rows: [...rows].sort((a, b) =>
          b.seniorityPercentile - a.seniorityPercentile
          || a.rank - b.rank
          || a.baseFleetLabel.localeCompare(b.baseFleetLabel)),
      }))
  })

  const figures = computed<StandingFigure[]>(() => {
    const entry = anchorEntry.value
    if (!entry) return []
    const presented = standingOutput.value?.presentation
    return [
      { label: 'Rank', value: presented?.rankLabel ?? PLACEHOLDER },
      { label: 'Seniority Number', value: String(entry.seniority_number) },
      { label: 'Roster Size', value: presented?.rosterSizeValueLabel ?? PLACEHOLDER, ...(presented?.rosterSizeTrend ? { note: presented.rosterSizeTrend } : {}) },
      { label: 'Seniority Percentile', value: presented?.seniorityPercentileLabel ?? PLACEHOLDER },
      { label: 'Active pilots', value: presented?.activePilotCountLabel ?? PLACEHOLDER },
      { label: 'Retirements senior to you (next 12 months)', value: presented?.retirementsSeniorToAnchorCountLabel ?? PLACEHOLDER },
    ]
  })

  return { rankCard, baseStatus, qualificationGroups, figures }
}
