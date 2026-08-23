import type { SeniorityEntry, SeniorityEntryInput } from '~/utils/schemas/seniority-list'
import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'
import type { Qualification, SenioritySnapshot } from './types'
import { qualificationKey } from './qualification-key'

/** Cross-row rules that prevent an entry collection from becoming a snapshot. */
export type SenioritySnapshotIssueCode = 'duplicate_seniority_number' | 'duplicate_employee_number'

/** A structural validation problem associated with one input row. */
export interface SenioritySnapshotValidationIssue {
  code: SenioritySnapshotIssueCode
  field: 'seniority_number' | 'employee_number'
  rowIndex: number
  message: string
}

type EntryIdentity = Pick<SeniorityEntryInput, 'seniority_number' | 'employee_number'>

function collectDuplicateIssues(entries: readonly Partial<EntryIdentity>[]): SenioritySnapshotValidationIssue[] {
  const issues: SenioritySnapshotValidationIssue[] = []

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
    const emp = typeof entry.employee_number === 'string'
      ? normalizeEmployeeNumber(entry.employee_number.trim())
      : ''
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

function issuesToErrorMap(issues: SenioritySnapshotValidationIssue[]): Map<number, string[]> {
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
 * Checks the same constraints that createSenioritySnapshot enforces (uniqueness of seniority
 * and employee numbers) but collects every violation instead of failing on the first.
 * Used by computeStructuralErrors as the authoritative source for these rules.
 */
export function validateSnapshotEntries(entries: Partial<EntryIdentity>[]): Map<number, string[]> {
  return issuesToErrorMap(collectDuplicateIssues(entries))
}

/** Returns every duplicate employee-number and seniority-number violation. */
export function validateSnapshotEntryIssues(entries: readonly Partial<EntryIdentity>[]): SenioritySnapshotValidationIssue[] {
  return collectDuplicateIssues(entries)
}

/** Returns sorted, non-empty values for one qualification dimension. */
export function getSeniorityEntryValues(entries: readonly SeniorityEntry[], field: 'fleet' | 'seat' | 'base'): readonly string[] {
  const values = new Set<string>()
  for (const e of entries) {
    const v = e[field]
    if (v) values.add(v)
  }
  return Array.from(values).sort()
}

/** Thrown when entries violate a snapshot invariant or lack qualification data. */
export class InvalidSenioritySnapshotDataError extends Error {
  constructor(message: string, public invalidEntry?: SeniorityEntry) {
      super(message)
  }
}

/**
 * Indexes validated seniority entries for repeatable organization analysis.
 *
 * Entries must have unique seniority and employee numbers. Every entry must
 * also provide base, seat, and fleet values. The returned snapshot retains the
 * original entry references and adds sorted and grouped lookup views.
 *
 * @throws {InvalidSenioritySnapshotDataError} When an invariant is not satisfied.
 */
export function createSenioritySnapshot(entries: readonly SeniorityEntry[]): SenioritySnapshot {
  const duplicateIssues = validateSnapshotEntryIssues(entries)
  if (duplicateIssues.length > 0) {
    const issue = duplicateIssues[0]!
    throw new InvalidSenioritySnapshotDataError(`${issue.message}.`, entries[issue.rowIndex])
  }

  for (const e of entries) {
    if (!e.base || !e.seat || !e.fleet)
      throw new InvalidSenioritySnapshotDataError(`Entry is missing required Qualification data (base/seat/fleet).`, e)
  }

  const entriesBySeniority = entries
    .toSorted((a, b) => a.seniority_number - b.seniority_number)

  const entriesByQualification = new Map<string, SeniorityEntry[]>()
  for (const e of entries) {
    const key = qualificationKey(e)
    let group = entriesByQualification.get(key)
    if (!group) { group = []; entriesByQualification.set(key, group) }
    group.push(e)
  }

  const entriesByEmployeeNumber = new Map<string, SeniorityEntry>()
  for (const e of entries) {
    entriesByEmployeeNumber.set(normalizeEmployeeNumber(e.employee_number), e)
  }

  const bases = getSeniorityEntryValues(entriesBySeniority, 'base')
  const seats = getSeniorityEntryValues(entriesBySeniority, 'seat')
  const fleets = getSeniorityEntryValues(entriesBySeniority, 'fleet')

  const qualSet = new Set<string>()
  const qualifications: Qualification[] = []
  for (const e of entries) {
    const key = qualificationKey(e)
    if (qualSet.has(key)) continue
    qualSet.add(key)
    qualifications.push({ seat: e.seat, fleet: e.fleet, base: e.base })
  }
  qualifications.sort((a, b) => qualificationKey(a).localeCompare(qualificationKey(b)))

  return {
    entries,
    entriesBySeniority,
    entriesByQualification,
    entriesByEmployeeNumber,
    bases,
    seats,
    fleets,
    qualifications,
  }
}
