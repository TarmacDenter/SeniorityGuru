import type { DiffRow } from './build-diff-rows'

export interface DiffRowDetail {
  label: string
  value: string
}

/** A DiffRow as the comparison table shows it: finished text, nothing left to format. */
export interface DiffRowView {
  key: string
  kind: DiffRow['kind']
  seniorityNumber: number
  name: string
  /** Base, Seat, Fleet order, e.g. "JFK CA 320". Current values for a moved pilot. */
  qualification: string
  /** The change-kind badge text. */
  change: string
  /** 'retired' also marks departed pilots so the table strikes their line through. */
  status: 'retired' | 'active'
  isAnchor: boolean
  details: DiffRowDetail[]
}

function signed(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta}`
}

function qualificationOf(row: DiffRow): string {
  if (row.kind === 'qualMove') return `${row.new_base} ${row.new_seat} ${row.new_fleet}`
  return `${row.base} ${row.seat} ${row.fleet}`
}

function moved(oldValue: string, newValue: string): string {
  return oldValue === newValue ? newValue : `${oldValue}→${newValue}`
}

export function changeLabel(row: DiffRow): string {
  switch (row.kind) {
    case 'retired': return 'Retired'
    case 'departed': return 'Departed'
    case 'newHire': return 'New Hire'
    case 'seniorityNumberChange': return `Seniority Number ${signed(row.delta)}`
    case 'qualMove': {
      const parts: string[] = []
      if (row.old_seat !== row.new_seat) parts.push(`${row.old_seat}→${row.new_seat}`)
      if (row.old_fleet !== row.new_fleet) parts.push(`${row.old_fleet}→${row.new_fleet}`)
      if (row.old_base !== row.new_base) parts.push(`${row.old_base}→${row.new_base}`)
      return parts.join(' / ') || 'Qualification move'
    }
  }
}

function detailsOf(row: DiffRow): DiffRowDetail[] {
  const identity: DiffRowDetail[] = [{ label: 'Employee #', value: row.employee_number }]
  switch (row.kind) {
    case 'qualMove':
      return [
        ...identity,
        { label: 'Seniority Number', value: String(row.seniority_number) },
        { label: 'Seat', value: moved(row.old_seat, row.new_seat) },
        { label: 'Fleet', value: moved(row.old_fleet, row.new_fleet) },
        { label: 'Base', value: moved(row.old_base, row.new_base) },
        { label: 'Hired', value: row.hire_date },
        { label: 'Retire date', value: row.retire_date },
      ]
    case 'seniorityNumberChange':
      return [
        ...identity,
        { label: 'Seniority Number', value: `${row.old_seniority_number}→${row.seniority_number} (delta ${signed(row.delta)})` },
        { label: 'Seat', value: row.seat },
        { label: 'Fleet', value: row.fleet },
        { label: 'Base', value: row.base },
        { label: 'Hired', value: row.hire_date },
        { label: 'Retire date', value: row.retire_date },
      ]
    case 'retired':
      return [
        ...identity,
        { label: 'Seniority Number', value: String(row.seniority_number) },
        { label: 'Seat', value: row.seat },
        { label: 'Fleet', value: row.fleet },
        { label: 'Base', value: row.base },
        { label: 'Hired', value: row.hire_date },
        { label: 'Retired', value: row.retire_date },
      ]
    case 'departed':
    case 'newHire': {
      const list = [
        ...identity,
        { label: 'Seniority Number', value: String(row.seniority_number) },
        { label: 'Seat', value: row.seat },
        { label: 'Fleet', value: row.fleet },
        { label: 'Base', value: row.base },
        { label: 'Hired', value: row.hire_date },
      ]
      if (row.retire_date) list.push({ label: 'Retire date', value: row.retire_date })
      return list
    }
  }
}

export function presentDiffRows(
  rows: DiffRow[],
  options: { showSeniorityNumberChanges: boolean, userEmployeeNumber?: string },
): DiffRowView[] {
  return rows
    .filter(r => options.showSeniorityNumberChanges || r.kind !== 'seniorityNumberChange')
    .map(row => ({
      key: `${row.kind}-${row.employee_number}`,
      kind: row.kind,
      seniorityNumber: row.seniority_number,
      name: row.name ?? row.employee_number,
      qualification: qualificationOf(row),
      change: changeLabel(row),
      status: row.kind === 'retired' || row.kind === 'departed' ? 'retired' : 'active',
      isAnchor: !!options.userEmployeeNumber && row.employee_number === options.userEmployeeNumber,
      details: detailsOf(row),
    }))
}
