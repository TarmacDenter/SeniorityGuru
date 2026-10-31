import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'
import { isRetiredBy } from '~/utils/date'
import { calculateSeniorityPercentile } from '~/utils/seniority-analysis/math'
import type { QualificationScope } from './qualification-scope'
import { qualificationScopeToEntryPredicate } from './qualification-scope'
import type { PlainDate } from '~/utils/temporal'

/** Current state of a Qualification viewer entry. */
export type QualificationViewerStatus = 'active' | 'retired' | 'inserted'

/** One list entry or inserted Anchor Pilot marker in a Qualification view. */
export interface QualificationViewerEntry {
  entry: SeniorityEntry | null
  seniorityNumber: number
  employeeNumber: string
  name: string | undefined
  base: string
  fleet: string
  seat: string
  hireDate: PlainDate
  retirementDate: PlainDate | null
  status: QualificationViewerStatus
  isAnchor: boolean
  isMarker: boolean
  /** Static one-based position in the published order, retired pilots included. */
  publicationPosition: number
  companyRank: number | null
  companyPercentile: number | null
  qualificationRank: number | null
  qualificationPercentile: number | null
}

/** Entries and capabilities for one Qualification view. */
export interface QualificationViewerAnalysis {
  entries: readonly QualificationViewerEntry[]
  /** Pilots in the selected set in the publication, retired included. Excludes the inserted marker. */
  rosterSize: number
  /** Pilots in the selected set still active at the As-of Date. Excludes the inserted marker. */
  activePilotCount: number
  qualificationScope: QualificationScope
  canInsert: boolean
  anchorFound: boolean
}

/** Input for a pure, qualification-scoped list projection. */
export interface AnalyzeQualificationViewerOptions {
  entries: readonly SeniorityEntry[]
  qualificationScope?: QualificationScope
  employeeNumber?: string | null
  insertSelf?: boolean
  asOfDate: PlainDate
}

/**
 * Projects a sorted qualification list with active ranks and optional user
 * marker insertion. It never changes the source entries.
 */
export function analyzeSeniorityQualificationViewer(options: AnalyzeQualificationViewerOptions): QualificationViewerAnalysis {
  const { entries, employeeNumber } = options
  const asOfDate = options.asOfDate
  const qualificationScope = options.qualificationScope ?? {}
  const userEmployeeKey = employeeNumber ? normalizeEmployeeNumber(employeeNumber) : null
  const ordered = [...entries].sort((a, b) => a.seniority_number - b.seniority_number)
  const anchor = userEmployeeKey
    ? ordered.find(e => normalizeEmployeeNumber(e.employee_number) === userEmployeeKey)
    : undefined
  const canInsert = !!anchor
  const matches = ordered.filter(qualificationScopeToEntryPredicate(qualificationScope))
  const anchorInQual = !!anchor && matches.some(e => normalizeEmployeeNumber(e.employee_number) === userEmployeeKey)
  const markerEnabled = !!options.insertSelf && canInsert && !anchorInQual && !!(qualificationScope.base && qualificationScope.seat && qualificationScope.fleet)
  const markerRetired = !!anchor?.retire_date && isRetiredBy(anchor.retire_date, asOfDate)

  const activeEntries = ordered.filter(e => !e.retire_date || !isRetiredBy(e.retire_date, asOfDate))
  const activeCompanyRank = new Map<string, number>()
  activeEntries.forEach((e, index) => activeCompanyRank.set(normalizeEmployeeNumber(e.employee_number), index + 1))
  const companyRosterSize = ordered.length
  const publicationPositionByEmployee = new Map<string, number>()
  ordered.forEach((entry, index) => publicationPositionByEmployee.set(normalizeEmployeeNumber(entry.employee_number), index + 1))

  const activeQualEntries = matches.filter(e => !e.retire_date || !isRetiredBy(e.retire_date, asOfDate))
  const qualRosterSize = matches.length
  const qualRankByEmployee = new Map<string, number>()
  activeQualEntries.forEach((e, index) => qualRankByEmployee.set(normalizeEmployeeNumber(e.employee_number), index + 1))

  const rankFields = (companyRank: number | null, qualificationRank: number | null) => ({
    companyRank,
    companyPercentile: companyRank === null ? null : calculateSeniorityPercentile(companyRank, companyRosterSize),
    qualificationRank,
    qualificationPercentile: qualificationRank === null ? null : calculateSeniorityPercentile(qualificationRank, qualRosterSize),
  })

  const rows = matches.map((entry): QualificationViewerEntry => {
    const retired = !!entry.retire_date && isRetiredBy(entry.retire_date, asOfDate)
    const employeeKey = normalizeEmployeeNumber(entry.employee_number)
    const companyRank = retired ? null : activeCompanyRank.get(employeeKey) ?? null
    const qualificationRank = retired ? null : qualRankByEmployee.get(employeeKey) ?? null
    return {
      entry,
      seniorityNumber: entry.seniority_number,
      employeeNumber: entry.employee_number,
      name: entry.name,
      base: entry.base,
      fleet: entry.fleet,
      seat: entry.seat,
      hireDate: entry.hire_date,
      retirementDate: entry.retire_date ?? null,
      status: retired ? 'retired' : 'active',
      isAnchor: !!userEmployeeKey && normalizeEmployeeNumber(entry.employee_number) === userEmployeeKey,
      isMarker: false,
      publicationPosition: publicationPositionByEmployee.get(employeeKey)!,
      ...rankFields(companyRank, qualificationRank),
    }
  })

  if (markerEnabled && anchor) {
    const markerIndex = rows.findIndex(row => row.seniorityNumber > anchor.seniority_number)
    const anchorKey = normalizeEmployeeNumber(anchor.employee_number)
    const markerCompanyRank = markerRetired ? null : activeCompanyRank.get(anchorKey) ?? null
    const markerQualRank = markerRetired ? null : activeQualEntries.filter(e => e.seniority_number < anchor.seniority_number).length + 1
    const marker: QualificationViewerEntry = {
      entry: null,
      seniorityNumber: anchor.seniority_number,
      employeeNumber: anchor.employee_number,
      name: anchor.name,
      base: qualificationScope.base!,
      fleet: qualificationScope.fleet!,
      seat: qualificationScope.seat!,
      hireDate: anchor.hire_date,
      retirementDate: anchor.retire_date ?? null,
      status: markerRetired ? 'retired' : 'inserted',
      isAnchor: true,
      isMarker: true,
      publicationPosition: publicationPositionByEmployee.get(anchorKey)!,
      ...rankFields(markerCompanyRank, markerQualRank),
    }
    rows.splice(markerIndex < 0 ? rows.length : markerIndex, 0, marker)
  }

  return {
    entries: rows,
    rosterSize: qualRosterSize,
    activePilotCount: activeQualEntries.length,
    qualificationScope,
    canInsert,
    anchorFound: canInsert,
  }
}
