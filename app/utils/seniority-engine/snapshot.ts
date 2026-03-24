import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { SenioritySnapshot, Qual } from './types'
import { uniqueEntryValues } from '~/utils/entry-filters'

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
    const key = `${e.base}|${e.seat}|${e.fleet}`
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
