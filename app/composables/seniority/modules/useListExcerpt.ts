import type { QualificationViewerStatus } from '~/utils/seniority'
import { useSeniorityCore } from './useSeniorityCore'

/** One row of the Seniority List excerpt around the Anchor Pilot, with display text ready to render. */
export interface ListExcerptRow {
  seniorityNumber: number
  employeeNumber: string
  nameLabel: string
  /** Rank among active pilots; a placeholder for a retired pilot, who has none. */
  rankLabel: string
  publicationPositionLabel: string
  status: QualificationViewerStatus
  /** True for the Anchor Pilot's own line (in New Hire Mode, the synthetic entry). */
  isAnchor: boolean
}

/**
 * Rows of the company-wide Seniority List around the Anchor Pilot: `radius` rows above and below,
 * the Anchor Pilot's own row flagged. Reads the same analysis as the rest of the dashboard, so in
 * New Hire Mode the synthetic entry is the anchor row.
 */
export function useListExcerpt(radius = 5) {
  const { analysis, anchoredAnalysis } = useSeniorityCore()

  const output = computed(() => {
    const anchor = anchoredAnalysis.value?.anchor
    if (!anchor) return null
    return analysis.value?.qualificationViewer({
      qualificationScope: {},
      employeeNumber: anchor.employee_number,
      insertSelf: false,
    }) ?? null
  })

  const rows = computed<ListExcerptRow[]>(() => {
    const entries = output.value?.presentation.entries ?? []
    const at = entries.findIndex(entry => entry.isAnchor)
    if (at < 0) return []
    return entries.slice(Math.max(0, at - radius), at + radius + 1).map(entry => ({
      seniorityNumber: entry.seniorityNumber,
      employeeNumber: entry.employeeNumber,
      nameLabel: entry.name ?? entry.employeeNumber,
      rankLabel: entry.companyRankLabel,
      publicationPositionLabel: entry.publicationPositionLabel,
      status: entry.status,
      isAnchor: entry.isAnchor,
    }))
  })

  return { rows }
}
