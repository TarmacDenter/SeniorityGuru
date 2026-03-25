import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { SeniorityEntrySchema } from '~/utils/schemas/seniority-list'

/**
 * Runs Zod schema validation plus duplicate and contiguity checks over a
 * batch of partial entries. Returns a map of row-index → error messages.
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
      for (const i of indices) {
        const existing = errors.get(i) ?? []
        existing.push(`seniority_number: Duplicate seniority number ${num}`)
        errors.set(i, existing)
      }
    }
  }

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
