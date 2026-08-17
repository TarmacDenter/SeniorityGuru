import type { LocalImportAttempt, LocalSeniorityEntry, LocalSeniorityList, SeniorityList } from './db'
import { parseInstant, parsePlainDate, serializeInstant, serializePlainDate } from './temporal'
import type { SeniorityEntry, SeniorityEntryInput } from './schemas/seniority-list'

export function localEntryToSeniorityEntry(local: LocalSeniorityEntry): SeniorityEntry {
  return {
    seniority_number: local.seniorityNumber,
    employee_number: local.employeeNumber,
    name: local.name ?? undefined,
    seat: local.seat,
    base: local.base,
    fleet: local.fleet,
    hire_date: parsePlainDate(local.hireDate),
    retire_date: local.retireDate ? parsePlainDate(local.retireDate) : undefined,
  }
}

export function seniorityEntryToLocalEntry(entry: SeniorityEntry, listId?: number): Omit<LocalSeniorityEntry, 'id'> {
  return {
    ...(listId === undefined ? {} : { listId }),
    seniorityNumber: entry.seniority_number,
    employeeNumber: entry.employee_number,
    name: entry.name ?? null,
    seat: entry.seat,
    base: entry.base,
    fleet: entry.fleet,
    hireDate: serializePlainDate(entry.hire_date),
    retireDate: entry.retire_date ? serializePlainDate(entry.retire_date) : '',
  } as Omit<LocalSeniorityEntry, 'id'>
}

export function seniorityEntryToInput(entry: SeniorityEntry): SeniorityEntryInput {
  return {
    ...entry,
    hire_date: serializePlainDate(entry.hire_date),
    retire_date: entry.retire_date ? serializePlainDate(entry.retire_date) : undefined,
  }
}

export function localListToSeniorityList(local: LocalSeniorityList): SeniorityList {
  return {
    ...local,
    effectiveDate: parsePlainDate(local.effectiveDate),
    createdAt: parseInstant(local.createdAt || '1970-01-01T00:00:00Z'),
  }
}

export function seniorityListToLocalList(list: SeniorityList): LocalSeniorityList {
  return {
    ...list,
    effectiveDate: serializePlainDate(list.effectiveDate),
    createdAt: serializeInstant(list.createdAt),
  }
}

export interface ImportAttemptDomain extends Omit<LocalImportAttempt, 'createdAt' | 'updatedAt'> {
  createdAt: ReturnType<typeof parseInstant>
  updatedAt: ReturnType<typeof parseInstant>
}

export function localImportAttemptToDomain(local: LocalImportAttempt): ImportAttemptDomain {
  return {
    ...local,
    createdAt: parseInstant(local.createdAt),
    updatedAt: parseInstant(local.updatedAt),
  }
}
