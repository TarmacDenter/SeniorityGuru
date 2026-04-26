import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { SenioritySnapshot, Qual } from './types'
import { cellKey } from './cell-key'

export type SnapshotIssueCode = 'duplicate_seniority_number' | 'duplicate_employee_number'

export interface SnapshotValidationIssue {
  code: SnapshotIssueCode
  field: 'seniority_number' | 'employee_number'
  rowIndex: number
  message: string
}

function collectDuplicateIssues(entries: readonly Partial<SeniorityEntry>[]): SnapshotValidationIssue[] {
  const issues: SnapshotValidationIssue[] = []

  const senNumToIndices = new Map<number, number[]>()
  entries.forEach((entry, i) => {
    const num = entry.seniority_number
    if (typeof num === 'number' && Number.isInteger(num) && num > 0) {
      const indices = senNumToIndices.get(num) ?? []
      indices.push(i)
      senNumToIndices.set(num, indices)
    }
  })
  for (const [num, indices] of senNumToIndices) {
    if (indices.length > 1) {
      for (const rowIndex of indices) {
        issues.push({
          code: 'duplicate_seniority_number',
          field: 'seniority_number',
          rowIndex,
          message: `Duplicate seniority number ${num}`,
        })
      }
    }
  }

  const empToIndices = new Map<string, number[]>()
  entries.forEach((entry, i) => {
    const emp = typeof entry.employee_number === 'string' ? entry.employee_number.trim() : ''
    if (emp.length > 0) {
      const indices = empToIndices.get(emp) ?? []
      indices.push(i)
      empToIndices.set(emp, indices)
    }
  })
  for (const [emp, indices] of empToIndices) {
    if (indices.length > 1) {
      for (const rowIndex of indices) {
        issues.push({
          code: 'duplicate_employee_number',
          field: 'employee_number',
          rowIndex,
          message: `Duplicate employee number ${emp}`,
        })
      }
    }
  }

  return issues
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
  const values = new Set<string>()
  for (const e of entries) {
    const v = e[field]
    if (v) values.add(v)
  }
  return Array.from(values).sort()
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
