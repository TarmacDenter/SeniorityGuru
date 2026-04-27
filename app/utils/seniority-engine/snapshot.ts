import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { SenioritySnapshot, Qual } from './types'
import { cellKey } from './cell-key'
import { pipe, map, filter, unique, sort, groupBy } from 'remeda'

export type SnapshotIssueCode = 'duplicate_seniority_number' | 'duplicate_employee_number'

export interface SnapshotValidationIssue {
  code: SnapshotIssueCode
  field: 'seniority_number' | 'employee_number'
  rowIndex: number
  message: string
}

function collectDuplicateIssues(entries: readonly Partial<SeniorityEntry>[]): SnapshotValidationIssue[] {
  const indexedEntries = entries.map((entry, rowIndex) => ({ entry, rowIndex }))

  const seniorityNumberIssues = pipe(
    indexedEntries,
    filter(({ entry }) =>
      typeof entry.seniority_number === 'number'
      && Number.isInteger(entry.seniority_number)
      && entry.seniority_number > 0,
    ),
    groupBy(({ entry }) => String(entry.seniority_number)),
  )
  const seniorityDuplicateGroups = Object.entries(seniorityNumberIssues).filter(([, rows]) => rows.length > 1)
  const seniorityIssues = seniorityDuplicateGroups.flatMap(([num, rows]) =>
    rows.map(({ rowIndex }) => ({
      code: 'duplicate_seniority_number' as const,
      field: 'seniority_number' as const,
      rowIndex,
      message: `Duplicate seniority number ${Number(num)}`,
    })),
  )

  const employeeNumberGroups = pipe(
    indexedEntries,
    map(({ entry, rowIndex }) => ({
      employeeNumber: typeof entry.employee_number === 'string' ? entry.employee_number.trim() : '',
      rowIndex,
    })),
    filter(({ employeeNumber }) => employeeNumber.length > 0),
    groupBy(({ employeeNumber }) => employeeNumber),
  )
  const employeeDuplicateGroups = Object.entries(employeeNumberGroups).filter(([, rows]) => rows.length > 1)
  const employeeIssues = employeeDuplicateGroups.flatMap(([employeeNumber, rows]) =>
    rows.map(({ rowIndex }) => ({
      code: 'duplicate_employee_number' as const,
      field: 'employee_number' as const,
      rowIndex,
      message: `Duplicate employee number ${employeeNumber}`,
    })),
  )

  return [...seniorityIssues, ...employeeIssues]
}

function issuesToErrorMap(issues: SnapshotValidationIssue[]): Map<number, string[]> {
  const errors = new Map<number, string[]>()
  for (const issue of issues) {
    const rowErrors = errors.get(issue.rowIndex) ?? []
    rowErrors.push(`${issue.field}: ${issue.message}`)
    errors.set(issue.rowIndex, rowErrors)
  }
  return errors
}

/**
 * Returns all cross-row snapshot invariant violations as a row-indexed error map.
 * Checks the same constraints that createSnapshot enforces (uniqueness of seniority
 * and employee numbers) but collects every violation instead of failing on the first.
 * Used by computeStructuralErrors as the authoritative source for these rules.
 */
export function validateSnapshotEntries(entries: Partial<SeniorityEntry>[]): Map<number, string[]> {
  return issuesToErrorMap(collectDuplicateIssues(entries))
}

export function validateSnapshotEntryIssues(entries: readonly Partial<SeniorityEntry>[]): SnapshotValidationIssue[] {
  return collectDuplicateIssues(entries)
}

export function uniqueEntryValues(entries: SeniorityEntry[], field: 'fleet' | 'seat' | 'base'): string[] {
  return pipe(
    entries,
    map((entry) => entry[field]),
    filter((value): value is string => Boolean(value)),
    unique(),
    sort((a, b) => a.localeCompare(b)),
  )
}

export class InvalidSnapshotDataError extends Error {
  constructor(message: string, public invalidEntry?: SeniorityEntry) {
      super(message)
  }
}

export function createSnapshot(entries: readonly SeniorityEntry[]): SenioritySnapshot {
  const duplicateIssues = validateSnapshotEntryIssues(entries)
  if (duplicateIssues.length > 0) {
    const issue = duplicateIssues[0]!
    throw new InvalidSnapshotDataError(`${issue.message}.`, entries[issue.rowIndex])
  }

  for (const e of entries) {
    if (!e.base || !e.seat || !e.fleet)
      throw new InvalidSnapshotDataError(`Entry is missing required qual data (base/seat/fleet).`, e)
  }

  const sortedEntries = entries
    .toSorted((a, b) => a.seniority_number - b.seniority_number)

  const byCell = new Map<string, SeniorityEntry[]>()
  for (const e of entries) {
    const key = cellKey(e)
    let group = byCell.get(key)
    if (!group) { group = []; byCell.set(key, group) }
    group.push(e)
  }

  const byEmployeeNumber = new Map<string, SeniorityEntry>()
  for (const e of entries) {
    byEmployeeNumber.set(e.employee_number, e)
  }

  const uniqueBases = uniqueEntryValues(sortedEntries, 'base')
  const uniqueSeats = uniqueEntryValues(sortedEntries, 'seat')
  const uniqueFleets = uniqueEntryValues(sortedEntries, 'fleet')

  const qualSet = new Set<string>()
  const quals: Qual[] = []
  for (const e of entries) {
    const label = `${e.seat}/${e.fleet}/${e.base}`
    if (qualSet.has(label)) continue
    qualSet.add(label)
    quals.push({ seat: e.seat, fleet: e.fleet, base: e.base, label })
  }
  quals.sort((a, b) => a.label.localeCompare(b.label))

  return {
    entries,
    sortedEntries,
    byCell,
    byEmployeeNumber,
    uniqueBases,
    uniqueSeats,
    uniqueFleets,
    quals,
  }
}
