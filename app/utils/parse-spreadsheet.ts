import { normalizeEmployeeNumber } from '~/utils/schemas/seniority-list'
import { normalizeDate, computeRetireDate } from '~/utils/date'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'

export interface ColumnMap {
  seniority_number: number
  employee_number: number
  seat: number
  base: number
  fleet: number
  name: number        // -1 = skip
  hire_date: number
  retire_date: number // -1 = skip
}

export interface MappingOptions {
  nameMode?: 'single' | 'separate'
  firstNameCol?: number
  lastNameCol?: number
  retireMode?: 'direct' | 'dob'
  dobCol?: number
  retirementAge?: number
}

export function parseSpreadsheetData(raw: string[][]): { headers: string[]; rows: string[][] } {
  const [headers, ...rows] = raw
  return { headers: headers ?? [], rows }
}

export function autoDetectColumnMap(headers: string[]): ColumnMap {
  const lower = headers.map(h => h.toLowerCase().trim())

  function findIndex(aliases: string[]): number {
    return lower.findIndex(h => aliases.some(a => h.includes(a)))
  }

  return {
    seniority_number: findIndex(['seniority', 'sen #', 'sen_num', 'sen num', 'seniority number', 'seniority_number']),
    employee_number: findIndex(['employee', 'emp id', 'emp_id', 'empid', 'employee id', 'employee_id', 'employee number', 'employee_number']),
    seat: findIndex(['seat', 'position', 'pos', 'status']),
    base: findIndex(['base', 'domicile', 'dom', 'station']),
    fleet: findIndex(['fleet', 'equipment', 'equip', 'aircraft', 'acft', 'ac type']),
    name: findIndex(['name', 'pilot name', 'full name']),
    hire_date: findIndex(['hire', 'hire date', 'hire_date', 'doh', 'date of hire']),
    retire_date: findIndex(['retire', 'retirement', 'retire date', 'retire_date', 'retirement date']),
  }
}

export function applyColumnMap(
  rows: string[][],
  map: ColumnMap,
  options: MappingOptions,
): Partial<SeniorityEntry>[] {
  return rows.map((row) => {
    const get = (idx: number) => {
      if (idx < 0 || idx >= row.length) return undefined
      const val = row[idx]
      return val != null ? String(val).trim() : undefined
    }

    const senStr = get(map.seniority_number)
    const empStr = get(map.employee_number)

    let name: string | undefined
    if (options.nameMode === 'separate' && options.lastNameCol != null && options.firstNameCol != null) {
      const last = get(options.lastNameCol)
      const first = get(options.firstNameCol)
      if (last || first) name = [last, first].filter(Boolean).join(', ')
    } else if (map.name >= 0) {
      name = get(map.name)
    }

    let retire_date: string | undefined
    if (options.retireMode === 'dob' && options.dobCol != null) {
      const dob = get(options.dobCol)
      if (dob) retire_date = computeRetireDate(normalizeDate(dob), options.retirementAge ?? 65)
    } else if (map.retire_date >= 0) {
      const raw = get(map.retire_date)
      if (raw) retire_date = normalizeDate(raw)
    }

    const entry: Partial<SeniorityEntry> = {
      seniority_number: senStr ? parseInt(senStr, 10) : undefined,
      employee_number: empStr ? normalizeEmployeeNumber(empStr) : undefined,
      seat: get(map.seat) || undefined,
      base: get(map.base) || undefined,
      fleet: get(map.fleet) || undefined,
    }

    if (name) entry.name = name
    const hireDateStr = get(map.hire_date)
    if (hireDateStr) entry.hire_date = normalizeDate(hireDateStr)
    else entry.hire_date = undefined // required field — will trigger validation error
    if (retire_date) entry.retire_date = retire_date

    return entry
  })
}
