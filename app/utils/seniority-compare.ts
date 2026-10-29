import { normalizeEmployeeNumber, type SeniorityEntry } from '~/utils/schemas/seniority-list'
import { Temporal } from '~/utils/temporal'

type Entry = SeniorityEntry

export interface RetiredPilot {
  employee_number: string
  name: string | undefined
  seniority_number: number
  retire_date: string
  seat: string
  fleet: string
  base: string
  hire_date: string
}

export interface DepartedPilot {
  employee_number: string
  name: string | undefined
  seniority_number: number
  retire_date: string | undefined
  seat: string
  fleet: string
  base: string
  hire_date: string
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
  hire_date: string
  retire_date: string
}

export interface SeniorityNumberChange {
  employee_number: string
  name: string | undefined
  old_seniority_number: number
  new_seniority_number: number
  delta: number
  seat: string
  fleet: string
  base: string
  hire_date: string
  retire_date: string
}

export interface NewHire {
  employee_number: string
  name: string | undefined
  seniority_number: number
  hire_date: string
  seat: string
  fleet: string
  base: string
  retire_date: string
}

export interface CompareResult {
  retired: RetiredPilot[]
  departed: DepartedPilot[]
  qualMoves: QualMove[]
  seniorityNumberChanges: SeniorityNumberChange[]
  newHires: NewHire[]
}

export function computeComparison(
  olderEntries: Entry[],
  newerEntries: Entry[],
  newerEffectiveDate: string,
): CompareResult {
  const olderMap = new Map<string, Entry>()
  for (const e of olderEntries) olderMap.set(normalizeEmployeeNumber(e.employee_number), e)

  const newerMap = new Map<string, Entry>()
  for (const e of newerEntries) newerMap.set(normalizeEmployeeNumber(e.employee_number), e)

  const retired: RetiredPilot[] = []
  const departed: DepartedPilot[] = []
  const qualMoves: QualMove[] = []
  const seniorityNumberChanges: SeniorityNumberChange[] = []
  const newHires: NewHire[] = []

  for (const [empNum, old] of olderMap) {
    if (!newerMap.has(empNum)) {
      if (old.retire_date && Temporal.PlainDate.compare(old.retire_date, Temporal.PlainDate.from(newerEffectiveDate)) <= 0) {
        retired.push({
          employee_number: old.employee_number,
          name: old.name,
          seniority_number: old.seniority_number,
          retire_date: old.retire_date.toString(),
          seat: old.seat,
          fleet: old.fleet,
          base: old.base,
          hire_date: old.hire_date.toString(),
        })
      } else {
        departed.push({
          employee_number: old.employee_number,
          name: old.name,
          seniority_number: old.seniority_number,
          retire_date: old.retire_date?.toString(),
          seat: old.seat,
          fleet: old.fleet,
          base: old.base,
          hire_date: old.hire_date.toString(),
        })
      }
    }
  }

  for (const [empNum, newer] of newerMap) {
    const older = olderMap.get(empNum)
    if (!older) continue

    if (older.seat !== newer.seat || older.fleet !== newer.fleet || older.base !== newer.base) {
      qualMoves.push({
        employee_number: newer.employee_number,
        name: newer.name,
        seniority_number: newer.seniority_number,
        old_seat: older.seat,
        new_seat: newer.seat,
        old_fleet: older.fleet,
        new_fleet: newer.fleet,
        old_base: older.base,
        new_base: newer.base,
        hire_date: newer.hire_date.toString(),
        retire_date: newer.retire_date?.toString() ?? '',
      })
    }

    if (older.seniority_number !== newer.seniority_number) {
      seniorityNumberChanges.push({
        employee_number: newer.employee_number,
        name: newer.name,
        old_seniority_number: older.seniority_number,
        new_seniority_number: newer.seniority_number,
        delta: older.seniority_number - newer.seniority_number,
        seat: newer.seat,
        fleet: newer.fleet,
        base: newer.base,
        hire_date: newer.hire_date.toString(),
        retire_date: newer.retire_date?.toString() ?? '',
      })
    }
  }

  for (const [empNum, entry] of newerMap) {
    if (!olderMap.has(empNum)) {
      newHires.push({
        employee_number: entry.employee_number,
        name: entry.name,
        seniority_number: entry.seniority_number,
        hire_date: entry.hire_date.toString(),
        seat: entry.seat,
        fleet: entry.fleet,
        base: entry.base,
        retire_date: entry.retire_date?.toString() ?? '',
      })
    }
  }

  return { retired, departed, qualMoves, seniorityNumberChanges, newHires }
}
