import type { ComputedRef, Ref } from 'vue'
import { isNoResult, resultOrNull, type QualificationScope } from '~/utils/seniority'
import { useSeniorityStore } from '~/stores/seniority'
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
}

export interface StatCard {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
}

export interface RetirementSnapshotData {
  /** Roster Size and active count today; the trajectory points carry only Rank and Seniority Percentile. */
  rosterSize: number
  activePilotCount: number
  atRetirement: { date: string; rank: number; percentile: number; rankDelta: string }
  fullTrajectory: { date: string; rank: number; percentile: number; rankDelta: string }[]
  retireDate: string
  /** Set when the trajectory is a Hypothetical Placement in the selected scope. */
  hypotheticalLabel: string | null
  /** Why the trajectory stops early, e.g. "Anchor Pilot retired"; null when it runs its full window. */
  endedByLabel: string | null
}

export function useStanding(qualificationScope?: Ref<QualificationScope> | ComputedRef<QualificationScope>): {
  rankCard: ComputedRef<RankCardData>
  baseStatus: ComputedRef<BaseStatusRow[]>
  statCards: ComputedRef<StatCard[]>
  retirementSnapshot: ComputedRef<RetirementSnapshotData | null>
} {
  const { anchoredAnalysis, projectionEndDate } = useSeniorityCore()
  const seniorityStore = useSeniorityStore()

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
    }))
  })

  const statCards = computed<StatCard[]>(() => {
    const lists = seniorityStore.lists
    const entry = anchorEntry.value
    const standing = standingResult.value
    const presented = standingOutput.value?.presentation

    let baseRankValue = PLACEHOLDER
    let baseRankTrend: string | undefined
    if (standing && entry?.base && entry?.seat && entry?.fleet) {
      const userQualification = presented?.qualificationStandings.find(
        item => item.qualification.base === entry.base
          && item.qualification.seat === entry.seat
          && item.qualification.fleet === entry.fleet,
      )
      if (userQualification) {
        baseRankValue = userQualification.rankLabel
        baseRankTrend = userQualification.rosterTrendLabel
      }
    }

    return [
      {
        label: presented?.rosterSizeLabel ?? 'Roster Size',
        ...(presented?.rosterSizeTrend ? { trend: presented.rosterSizeTrend } : {}),
        value: presented?.rosterSizeValueLabel ?? PLACEHOLDER,
        icon: 'i-lucide-users',
      },
      {
        label: 'Retirements (Next 12 mo.)',
        value: presented?.rollingNext12MonthRetirementsLabel ?? PLACEHOLDER,
        trend: entry ? presented?.retirementsSeniorToAnchorLabel : undefined,
        trendUp: (standing?.rollingNext12MonthRetirementsSeniorToAnchor ?? 0) > 0 || undefined,
        icon: 'i-lucide-calendar-clock',
      },
      {
        label: 'Your Base Rank',
        value: baseRankValue,
        trend: baseRankTrend,
        icon: 'i-lucide-map-pin',
      },
      {
        label: 'Lists Uploaded',
        value: lists.length.toLocaleString(),
        icon: 'i-lucide-file-text',
      },
    ]
  })

  const trajectoryOutput = computed(() => projectionEndDate.value
    ? anchoredAnalysis.value?.seniorityTrajectory({
      through: projectionEndDate.value,
      scenario: { qualificationScope: qualificationScope?.value ?? {} },
    }) ?? null
    : null)
  const trajectoryPoints = computed(() => {
    return resultOrNull(trajectoryOutput.value?.domain)?.points ?? null
  })
  const trajectoryEndedByLabel = computed(() => resultOrNull(trajectoryOutput.value?.presentation)?.endedByLabel ?? null)

  const retirementSnapshot = computed<RetirementSnapshotData | null>(() => {
    const entry = anchorEntry.value
    const trajectoryPointList = trajectoryPoints.value
    const standing = standingResult.value
    if (!entry?.retire_date || !standing || !trajectoryPointList || trajectoryPointList.length === 0) return null
    const fullTrajectory = trajectoryPointList.map((point, index, points) => {
      const previous = points[index - 1]
      const delta = previous ? point.rank - previous.rank : 0
      return {
        ...point,
        date: point.date.toString(),
        rankDelta: delta === 0 ? '--' : delta > 0 ? `+${delta}` : String(delta),
      }
    })
    return {
      rosterSize: standing.rosterSize,
      activePilotCount: standing.activePilotCount,
      atRetirement: fullTrajectory[fullTrajectory.length - 1]!,
      fullTrajectory,
      retireDate: entry.retire_date.toString(),
      hypotheticalLabel: standingOutput.value?.presentation.hypotheticalLabel ?? null,
      endedByLabel: trajectoryEndedByLabel.value,
    }
  })

  return { rankCard, baseStatus, statCards, retirementSnapshot }
}
