import type { SeniorityEntry } from '~/utils/schemas/seniority-list'

type Entry = SeniorityEntry

export interface RetiredPilot {
  employee_number: string
  name: string | undefined
  seniority_number: number
  retire_date: string
}

export interface DepartedPilot {
  employee_number: string
  name: string | undefined
  seniority_number: number
  retire_date: string | undefined
}

export interface QualMove {
  employee_number: string
  name: string | undefined
  seniority_number: number
  old_seat: string
  new_seat: string
  old_fleet: string
  new_fleet: string
  old_base: string
  new_base: string
}

export interface RankChange {
  employee_number: string
  name: string | undefined
  old_rank: number
  new_rank: number
  delta: number
}

export interface NewHire {
  employee_number: string
  name: string | undefined
  seniority_number: number
  hire_date: string
}

export interface CompareResult {
  retired: RetiredPilot[]
  departed: DepartedPilot[]
  qualMoves: QualMove[]
  rankChanges: RankChange[]
  newHires: NewHire[]
}

export function computeComparison(
  olderEntries: Entry[],
  newerEntries: Entry[],
  newerEffectiveDate: string,
): CompareResult {
  const olderMap = new Map<string, Entry>()
  for (const e of olderEntries) olderMap.set(e.employee_number, e)

  const newerMap = new Map<string, Entry>()
  for (const e of newerEntries) newerMap.set(e.employee_number, e)

  const retired: RetiredPilot[] = []
  const departed: DepartedPilot[] = []
  const qualMoves: QualMove[] = []
  const rankChanges: RankChange[] = []
  const newHires: NewHire[] = []

  for (const [empNum, old] of olderMap) {
    if (!newerMap.has(empNum)) {
      if (old.retire_date && old.retire_date <= newerEffectiveDate) {
        retired.push({
          employee_number: empNum,
          name: old.name,
          seniority_number: old.seniority_number,
          retire_date: old.retire_date,
        })
      } else {
        departed.push({
          employee_number: empNum,
          name: old.name,
          seniority_number: old.seniority_number,
          retire_date: old.retire_date,
        })
      }
    }
  }

  for (const [empNum, newer] of newerMap) {
    const older = olderMap.get(empNum)
    if (!older) continue

    if (older.seat !== newer.seat || older.fleet !== newer.fleet || older.base !== newer.base) {
      qualMoves.push({
        employee_number: empNum,
        name: newer.name,
        seniority_number: newer.seniority_number,
        old_seat: older.seat,
        new_seat: newer.seat,
        old_fleet: older.fleet,
        new_fleet: newer.fleet,
        old_base: older.base,
        new_base: newer.base,
      })
    }

    if (older.seniority_number !== newer.seniority_number) {
      rankChanges.push({
        employee_number: empNum,
        name: newer.name,
        old_rank: older.seniority_number,
        new_rank: newer.seniority_number,
        delta: older.seniority_number - newer.seniority_number,
      })
    }
  }

  for (const [empNum, entry] of newerMap) {
    if (!olderMap.has(empNum)) {
      newHires.push({
        employee_number: empNum,
        name: entry.name,
        seniority_number: entry.seniority_number,
        hire_date: entry.hire_date,
      })
    }
  }

  return { retired, departed, qualMoves, rankChanges, newHires }
}
