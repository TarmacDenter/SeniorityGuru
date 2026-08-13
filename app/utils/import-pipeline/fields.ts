/** Canonical fields accepted by every import plugin and the seniority boundary. */
export const IMPORT_FIELDS = [
  'seniority_number',
  'employee_number',
  'name',
  'seat',
  'base',
  'fleet',
  'hire_date',
  'retire_date',
] as const

export type ImportField = typeof IMPORT_FIELDS[number]

export const IMPORT_FIELD_LABELS: Readonly<Record<ImportField, string>> = {
  seniority_number: 'Seniority Number',
  employee_number: 'Employee Number',
  name: 'Name',
  seat: 'Seat',
  base: 'Base',
  fleet: 'Fleet',
  hire_date: 'Hire Date',
  retire_date: 'Retire Date',
}
