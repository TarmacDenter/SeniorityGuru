import type { LocalSeniorityEntry } from './db'
import type { SeniorityEntry } from './schemas/seniority-list'

export function localEntryToSeniorityEntry(local: LocalSeniorityEntry): SeniorityEntry {
  return {
    seniority_number: local.seniorityNumber,
    employee_number: local.employeeNumber,
    name: local.name ?? undefined,
    seat: local.seat,
    base: local.base,
    fleet: local.fleet,
    hire_date: local.hireDate,
    retire_date: local.retireDate,
  }
}
