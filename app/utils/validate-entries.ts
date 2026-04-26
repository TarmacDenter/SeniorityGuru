import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { SeniorityEntrySchema } from '~/utils/schemas/seniority-list'
import { validateSnapshotEntryIssues } from '~/utils/seniority-engine/snapshot'

export type ValidationIssueCode
  = | 'duplicate_seniority_number'
    | 'duplicate_employee_number'
    | 'non_contiguous_seniority_number'
    | 'schema_violation'

export interface ValidationIssue {
  code: ValidationIssueCode
  field: string
  rowIndex: number
  message: string
}

function pushIssue(map: Map<number, ValidationIssue[]>, issue: ValidationIssue) {
  const rowIssues = map.get(issue.rowIndex) ?? []
  rowIssues.push(issue)
  map.set(issue.rowIndex, rowIssues)
}

function issuesToErrorMap(issues: Map<number, ValidationIssue[]>): Map<number, string[]> {
  const errors = new Map<number, string[]>()
  for (const [rowIndex, rowIssues] of issues) {
    errors.set(rowIndex, rowIssues.map(issue => `${issue.field}: ${issue.message}`))
  }
  return errors
}

/**
 * Structural validation: snapshot invariants (duplicate seniority/employee numbers)
 * plus the upload-specific contiguity requirement (1..N sequence).
 * Does not run Zod schema validation. Pure function — no side effects.
 */
export function computeStructuralIssues(entries: Partial<SeniorityEntry>[]): Map<number, ValidationIssue[]> {
  const issues = new Map<number, ValidationIssue[]>()
  for (const snapshotIssue of validateSnapshotEntryIssues(entries)) {
    pushIssue(issues, {
      code: snapshotIssue.code,
      field: snapshotIssue.field,
      rowIndex: snapshotIssue.rowIndex,
      message: snapshotIssue.message,
    })
  }

  // Contiguity is an upload requirement; the snapshot engine does not enforce it
  const senNumToIndices = new Map<number, number[]>()
  entries.forEach((entry, i) => {
    const num = entry.seniority_number
    if (typeof num === 'number' && Number.isInteger(num) && num > 0) {
      const indices = senNumToIndices.get(num) ?? []
      indices.push(i)
      senNumToIndices.set(num, indices)
    }
  })

  const allNums = Array.from(senNumToIndices.keys()).sort((a, b) => a - b)
  if (allNums.length > 0) {
    const expected = allNums.length
    const max = allNums[allNums.length - 1]!
    if (max !== expected || allNums[0] !== 1) {
      const expectedSet = new Set(Array.from({ length: expected }, (_, i) => i + 1))
      for (const [num, indices] of senNumToIndices) {
        if (!expectedSet.has(num)) {
          for (const rowIndex of indices) {
            pushIssue(issues, {
              code: 'non_contiguous_seniority_number',
              field: 'seniority_number',
              rowIndex,
              message: `Non-contiguous sequence — expected 1..${expected}, found ${num}`,
            })
          }
        }
      }
    }
  }

  return issues
}

export function computeStructuralErrors(entries: Partial<SeniorityEntry>[]): Map<number, string[]> {
  return issuesToErrorMap(computeStructuralIssues(entries))
}

/**
 * Full validation: Zod schema + structural checks.
 * Pure function — no side effects, no reactive state.
 */
export function validateEntries(entries: Partial<SeniorityEntry>[]): Map<number, string[]> {
  const issues = new Map<number, ValidationIssue[]>()

  entries.forEach((entry, i) => {
    const result = SeniorityEntrySchema.safeParse(entry)
    if (!result.success) {
      for (const issue of result.error.issues) {
        pushIssue(issues, {
          code: 'schema_violation',
          field: issue.path.join('.'),
          rowIndex: i,
          message: issue.message,
        })
      }
    }
  })

  const structuralIssues = computeStructuralIssues(entries)
  for (const [idx, rowIssues] of structuralIssues) {
    for (const issue of rowIssues) {
      pushIssue(issues, { ...issue, rowIndex: idx })
    }
  }

  return issuesToErrorMap(issues)
}
