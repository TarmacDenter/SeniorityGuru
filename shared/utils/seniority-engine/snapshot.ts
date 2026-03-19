import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import type { SenioritySnapshot, Qual } from './types'
import { uniqueEntryValues } from '#shared/utils/entry-filters'

export function createSnapshot(entries: SeniorityEntry[]): SenioritySnapshot {
  // Sorted seniority numbers for binary search
  const sortedSenNums = entries
    .map(e => e.seniority_number)
    .sort((a, b) => a - b)

  // Group by cell key (base|seat|fleet)
  const byCell = new Map<string, SeniorityEntry[]>()
  for (const e of entries) {
    const key = `${e.base}|${e.seat}|${e.fleet}`
    let group = byCell.get(key)
    if (!group) { group = []; byCell.set(key, group) }
    group.push(e)
  }

  // Employee number index
  const byEmployeeNumber = new Map<string, SeniorityEntry>()
  for (const e of entries) {
    byEmployeeNumber.set(e.employee_number, e)
  }

  // Unique filter values
  const uniqueBases = uniqueEntryValues(entries, 'base')
  const uniqueSeats = uniqueEntryValues(entries, 'seat')
  const uniqueFleets = uniqueEntryValues(entries, 'fleet')

  // Qual labels (distinct seat/fleet/base combos)
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
    sortedSenNums,
    byCell,
    byEmployeeNumber,
    uniqueBases,
    uniqueSeats,
    uniqueFleets,
    quals,
  }
}
