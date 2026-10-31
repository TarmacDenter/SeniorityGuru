import type { ComputedRef, Ref } from 'vue'
import { isNoResult, resultOrNull, type QualificationScope } from '~/utils/seniority'
import { useSeniorityStore } from '~/stores/seniority'
import { useSeniorityCore } from './useSeniorityCore'

export interface RankCardData {
  seniorityNumber: number
  rank: number
  publicationPosition: number
  rosterSize: number
  publicationPilotCount: number
  activePilotCount: number
  isSimulated: boolean
  seniorityPercentile: number
  base: string
  seat: string
  fleet: string
  hireDate: string
  /** Why no Rank is available, e.g. "Anchor Pilot retired"; null when a Rank exists. */
  noResultLabel: string | null
  /** "Hypothetical Placement in <scope>" when you are not in the selected scope; null otherwise. */
  hypotheticalLabel: string | null
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
}

export function useStanding(qualificationScope?: Ref<QualificationScope> | ComputedRef<QualificationScope>): {
  rankCard: ComputedRef<RankCardData>
  baseStatus: ComputedRef<BaseStatusRow[]>
  statCards: ComputedRef<StatCard[]>
  retirementSnapshot: ComputedRef<RetirementSnapshotData | null>
} {
  const { analysis, anchoredAnalysis, newHire, projectionEndDate } = useSeniorityCore()
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
      return {
        seniorityNumber: entry.seniority_number,
        rank: 0,
        publicationPosition: 0,
        rosterSize: 0,
        publicationPilotCount: 0,
        activePilotCount: 0,
        isSimulated: false,
        seniorityPercentile: 0,
        base: entry.base ?? '--',
        seat: entry.seat ?? '--',
        fleet: entry.fleet ?? '--',
        hireDate: entry.hire_date.toString(),
        noResultLabel: standingNoResult.value.label,
        hypotheticalLabel: null,
      }
    }
    if (!entry || !standing) {
      return {
        seniorityNumber: 0,
        rank: 0,
        publicationPosition: 0,
        rosterSize: 0,
        publicationPilotCount: 0,
        activePilotCount: 0,
        isSimulated: false,
        seniorityPercentile: 0,
        base: '--',
        seat: '--',
        fleet: '--',
        hireDate: '--',
        noResultLabel: null,
        hypotheticalLabel: null,
      }
    }
    return {
      seniorityNumber: entry.seniority_number,
      rank: standing.rank,
      publicationPosition: standing.publicationPosition,
      rosterSize: standing.rosterSize,
      publicationPilotCount: seniorityStore.entries.length,
      activePilotCount: standing.activePilotCount,
      isSimulated: newHire.syntheticEntry.value?.employee_number === entry.employee_number,
      seniorityPercentile: standing.seniorityPercentile,
      base: entry.base ?? '--',
      seat: entry.seat ?? '--',
      fleet: entry.fleet ?? '--',
      hireDate: entry.hire_date.toString(),
      noResultLabel: null,
      hypotheticalLabel: standingOutput.value?.presentation.hypotheticalLabel ?? null,
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

    let baseRankValue = '--'
    let baseRankTrend: string | undefined
    if (standing && entry?.base && entry?.seat && entry?.fleet) {
      const userQualification = standingOutput.value?.presentation.qualificationStandings.find(
        item => item.qualification.base === entry.base
          && item.qualification.seat === entry.seat
          && item.qualification.fleet === entry.fleet,
      )
      if (userQualification) {
        baseRankValue = userQualification.rank.toLocaleString()
        baseRankTrend = `${userQualification.qualificationLabel} · of ${userQualification.rosterSize.toLocaleString()} on roster · ${userQualification.activePilotCount.toLocaleString()} active`
      }
    }

    const isModeled = rankCard.value.isSimulated
    const isHypothetical = !!rankCard.value.hypotheticalLabel
    const rosterQualifiers = [isModeled && 'modeled', isHypothetical && 'hypothetical'].filter(Boolean)
    const rosterTrends = [
      isModeled && `${rankCard.value.publicationPilotCount.toLocaleString()} in publication`,
      isHypothetical && 'includes you',
    ].filter(Boolean)

    return [
      {
        label: rosterQualifiers.length > 0 ? `Roster Size (${rosterQualifiers.join(', ')})` : 'Roster Size',
        ...(rosterTrends.length > 0 ? { trend: rosterTrends.join(' · ') } : {}),
        value: rankCard.value.rosterSize.toLocaleString(),
        icon: 'i-lucide-users',
      },
      {
        label: 'Retirements (Next 12 mo.)',
        value: standingOutput.value?.presentation.rollingNext12MonthRetirementsLabel
          ?? (analysis.value?.retirementsNext12Months() ?? 0).toLocaleString(),
        trend: entry && standing
          ? `${standing.rollingNext12MonthRetirementsSeniorToAnchor.toLocaleString()} senior to you`
          : undefined,
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

  const trajectoryResult = computed(() => projectionEndDate.value
    ? anchoredAnalysis.value?.seniorityTrajectory({
      through: projectionEndDate.value,
      scenario: { qualificationScope: qualificationScope?.value ?? {} },
    }).domain ?? null
    : null)
  const trajectoryPoints = computed(() => {
    return resultOrNull(trajectoryResult.value)?.points ?? null
  })

  const retirementSnapshot = computed<RetirementSnapshotData | null>(() => {
    const entry = anchorEntry.value
    const trajectoryPointList = trajectoryPoints.value
    if (!entry?.retire_date || !trajectoryPointList || trajectoryPointList.length === 0) return null
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
      rosterSize: standingResult.value?.rosterSize ?? 0,
      activePilotCount: standingResult.value?.activePilotCount ?? 0,
      atRetirement: fullTrajectory[fullTrajectory.length - 1]!,
      fullTrajectory,
      retireDate: entry.retire_date.toString(),
      hypotheticalLabel: standingOutput.value?.presentation.hypotheticalLabel ?? null,
    }
  })

  return { rankCard, baseStatus, statCards, retirementSnapshot }
}
