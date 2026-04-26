import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { SenioritySnapshot, Qual } from './types'
import { cellKey } from './cell-key'

/**
 * Returns all cross-row snapshot invariant violations as a row-indexed error map.
 * Checks the same constraints that createSnapshot enforces (uniqueness of seniority
 * and employee numbers) but collects every violation instead of failing on the first.
 * Used by computeStructuralErrors as the authoritative source for these rules.
 */
export function validateSnapshotEntries(entries: Partial<SeniorityEntry>[]): Map<number, string[]> {
  const errors = new Map<number, string[]>()

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
        const errs = errors.get(i) ?? []
        errs.push(`seniority_number: Duplicate seniority number ${num}`)
        errors.set(i, errs)
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
      for (const i of indices) {
        const errs = errors.get(i) ?? []
        errs.push(`employee_number: Duplicate employee number ${emp}`)
        errors.set(i, errs)
      }
    }
  }

  return errors
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
  const seenSenNums = new Set<number>()
  const seenEmpNums = new Set<string>()
  for (const e of entries) {
    if (!e.base || !e.seat || !e.fleet)
      throw new InvalidSnapshotDataError(`Entry is missing required qual data (base/seat/fleet).`, e)
    if (seenSenNums.has(e.seniority_number))
      throw new InvalidSnapshotDataError(`Duplicate seniority number: ${e.seniority_number}.`, e)
    if (seenEmpNums.has(e.employee_number))
      throw new InvalidSnapshotDataError(`Duplicate employee number: ${e.employee_number}.`, e)
    seenSenNums.add(e.seniority_number)
    seenEmpNums.add(e.employee_number)
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
