import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'
import { isRetiredBy } from '~/utils/date'
import { computePercentile } from './percentile'
import type { QualSpec } from './qual-spec'
import { qualSpecToFilter } from './qual-spec'

export type QualViewerStatus = 'active' | 'retired' | 'inserted'

export interface QualViewerRow {
  entry: SeniorityEntry | null
  seniorityNumber: number
  employeeNumber: string
  name: string | undefined
  base: string
  fleet: string
  seat: string
  hireDate: string
  retireDate: string
  status: QualViewerStatus
  isUser: boolean
  isMarker: boolean
  selectedListCompanySeniority: number
  selectedListCompanyPercentile: number
  companySeniority: number | null
  companyPercentile: number | null
  qualSeniority: number | null
  qualPercentile: number | null
}

export interface QualViewerResult {
  rows: QualViewerRow[]
  totalRows: number
  activeRows: number
  selectedQual: QualSpec
  canInsert: boolean
  anchorFound: boolean
}

export interface QualViewerOptions {
  entries: readonly SeniorityEntry[]
  qual?: QualSpec
  employeeNumber?: string | null
  insertSelf?: boolean
  asOfDate: string
}

export function projectQualViewer(options: QualViewerOptions): QualViewerResult {
  const { entries, employeeNumber, asOfDate } = options
  const qual = options.qual ?? {}
  const userEmployeeKey = employeeNumber ? normalizeEmployeeNumber(employeeNumber) : null
  const ordered = [...entries].sort((a, b) => a.seniority_number - b.seniority_number)
  const anchor = userEmployeeKey
    ? ordered.find(e => normalizeEmployeeNumber(e.employee_number) === userEmployeeKey)
    : undefined
  const canInsert = !!anchor
  const matches = ordered.filter(qualSpecToFilter(qual))
  const anchorInQual = !!anchor && matches.some(e => normalizeEmployeeNumber(e.employee_number) === userEmployeeKey)
  const markerEnabled = !!options.insertSelf && canInsert && !anchorInQual && !!(qual.base && qual.seat && qual.fleet)
  const markerRetired = !!anchor && isRetiredBy(anchor.retire_date, asOfDate)

  const activeEntries = ordered.filter(e => !isRetiredBy(e.retire_date, asOfDate))
  const activeCompanyRank = new Map<string, number>()
  activeEntries.forEach((e, index) => activeCompanyRank.set(e.employee_number, index + 1))
  const activeCompanyTotal = activeEntries.length
  const selectedListTotal = ordered.length

  const selectedListMetrics = (entry: SeniorityEntry) => ({
    seniorityNumber: entry.seniority_number,
    percentile: computePercentile(entry.seniority_number, selectedListTotal),
  })

  const activeQualEntries = matches.filter(e => !isRetiredBy(e.retire_date, asOfDate))
  const qualRankByEmployee = new Map<string, number>()
  activeQualEntries.forEach((e, index) => qualRankByEmployee.set(e.employee_number, index + 1))

  const rows = matches.map((entry): QualViewerRow => {
    const retired = isRetiredBy(entry.retire_date, asOfDate)
    const selected = selectedListMetrics(entry)
    const companySeniority = retired ? null : activeCompanyRank.get(entry.employee_number) ?? null
    return {
      entry,
      seniorityNumber: entry.seniority_number,
      employeeNumber: entry.employee_number,
      name: entry.name,
      base: entry.base,
      fleet: entry.fleet,
      seat: entry.seat,
      hireDate: entry.hire_date,
      retireDate: entry.retire_date,
      status: retired ? 'retired' : 'active',
      isUser: !!userEmployeeKey && normalizeEmployeeNumber(entry.employee_number) === userEmployeeKey,
      isMarker: false,
      selectedListCompanySeniority: selected.seniorityNumber,
      selectedListCompanyPercentile: selected.percentile,
      companySeniority,
      companyPercentile: companySeniority === null ? null : computePercentile(companySeniority, activeCompanyTotal),
      qualSeniority: retired ? null : qualRankByEmployee.get(entry.employee_number) ?? null,
      qualPercentile: null,
    }
  })

  if (markerEnabled && anchor) {
    const markerIndex = rows.findIndex(row => row.seniorityNumber > anchor.seniority_number)
    const marker: QualViewerRow = {
      entry: null,
      seniorityNumber: anchor.seniority_number,
      employeeNumber: anchor.employee_number,
      name: anchor.name,
      base: qual.base!,
      fleet: qual.fleet!,
      seat: qual.seat!,
      hireDate: anchor.hire_date,
      retireDate: anchor.retire_date,
      status: markerRetired ? 'retired' : 'inserted',
      isUser: true,
      isMarker: true,
      selectedListCompanySeniority: anchor.seniority_number,
      selectedListCompanyPercentile: computePercentile(anchor.seniority_number, selectedListTotal),
      companySeniority: markerRetired ? null : activeCompanyRank.get(anchor.employee_number) ?? null,
      companyPercentile: markerRetired ? null : computePercentile(activeCompanyRank.get(anchor.employee_number) ?? 0, activeCompanyTotal),
      qualSeniority: markerRetired ? null : activeQualEntries.filter(e => e.seniority_number < anchor.seniority_number).length + 1,
      qualPercentile: null,
    }
    rows.splice(markerIndex < 0 ? rows.length : markerIndex, 0, marker)
    const markerQualRank = marker.qualSeniority
    if (markerQualRank !== null) {
      for (const row of rows) {
        if (!row.isMarker && row.status === 'active' && row.seniorityNumber >= anchor.seniority_number) {
          row.qualSeniority = (row.qualSeniority ?? 0) + 1
        }
      }
    }
  }

  const activeQualTotal = rows.filter(row => row.status !== 'retired').length
  for (const row of rows) {
    if (row.qualSeniority !== null) {
      row.qualPercentile = computePercentile(row.qualSeniority, activeQualTotal)
    }
  }

  return {
    rows,
    totalRows: rows.length,
    activeRows: rows.filter(row => row.status !== 'retired').length,
    selectedQual: qual,
    canInsert,
    anchorFound: canInsert,
  }
}
