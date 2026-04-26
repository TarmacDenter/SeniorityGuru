import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { SeniorityEntrySchema } from '~/utils/schemas/seniority-list'
import { validateSnapshotEntries } from '~/utils/seniority-engine/snapshot'

/**
 * Structural validation: snapshot invariants (duplicate seniority/employee numbers)
 * plus the upload-specific contiguity requirement (1..N sequence).
 * Does not run Zod schema validation. Pure function — no side effects.
 */
export function computeStructuralErrors(entries: Partial<SeniorityEntry>[]): Map<number, string[]> {
  const errors = validateSnapshotEntries(entries)

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
          for (const i of indices) {
            const existing = errors.get(i) ?? []
            existing.push(`seniority_number: Non-contiguous sequence — expected 1..${expected}, found ${num}`)
            errors.set(i, existing)
          }
        }
      }
    }
  }

  return errors
}

/**
 * Full validation: Zod schema + structural checks.
 * Pure function — no side effects, no reactive state.
 */
export function validateEntries(entries: Partial<SeniorityEntry>[]): Map<number, string[]> {
  const errors = new Map<number, string[]>()

  entries.forEach((entry, i) => {
    const result = SeniorityEntrySchema.safeParse(entry)
    if (!result.success) {
      errors.set(i, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
    }
  })

  const structural = computeStructuralErrors(entries)
  for (const [idx, msgs] of structural) {
    const existing = errors.get(idx) ?? []
    existing.push(...msgs)
    errors.set(idx, existing)
  }

  return errors
}
