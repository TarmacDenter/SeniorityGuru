import { z } from 'zod'
import { normalizeDate, normalizeDateFuture } from '../date'
import { normalizeEmployeeNumber, SeniorityEntrySchema } from '../schemas/seniority-list'
import type { SeniorityEntryInput } from '../schemas/seniority-list'

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

export const ImportFieldSchema = z.enum(IMPORT_FIELDS)
export type ImportField = z.infer<typeof ImportFieldSchema>

export type MappingSelection =
  | { readonly kind: 'column'; readonly columnId: string }
  | { readonly kind: 'combined-name'; readonly firstNameColumnId: string; readonly lastNameColumnId: string }
  | { readonly kind: 'retirement-from-birth-date'; readonly columnId: string; readonly retirementAge: number }

type MappingStrategy = MappingSelection['kind']

interface ImportFieldDefinition {
  readonly label: string
  readonly required: boolean
  readonly mappingStrategies: readonly MappingStrategy[]
}

/** The single owner of persisted-field labels, requiredness, and mapping policy. */
export const IMPORT_FIELD_DEFINITIONS: Readonly<Record<ImportField, ImportFieldDefinition>> = {
  seniority_number: { label: 'Seniority Number', required: true, mappingStrategies: ['column'] },
  employee_number: { label: 'Employee Number', required: true, mappingStrategies: ['column'] },
  name: { label: 'Name', required: false, mappingStrategies: ['column', 'combined-name'] },
  seat: { label: 'Seat', required: true, mappingStrategies: ['column'] },
  base: { label: 'Base', required: true, mappingStrategies: ['column'] },
  fleet: { label: 'Fleet', required: true, mappingStrategies: ['column'] },
  hire_date: { label: 'Hire Date', required: true, mappingStrategies: ['column'] },
  retire_date: { label: 'Retire Date', required: true, mappingStrategies: ['column', 'retirement-from-birth-date'] },
}

export function importFieldLabel(field: ImportField): string {
  return IMPORT_FIELD_DEFINITIONS[field].label
}

export function requiredImportFields(pluginRequired: readonly ImportField[] = []): readonly ImportField[] {
  return [...new Set([...IMPORT_FIELDS.filter(field => IMPORT_FIELD_DEFINITIONS[field].required), ...pluginRequired])]
}

export function hasRequiredImportMappings(
  mappings: Readonly<Partial<Record<ImportField, MappingSelection>>>,
  pluginRequired: readonly ImportField[] = [],
  options: { readonly retirementFromBirthDate?: boolean } = {},
): boolean {
  return requiredImportFields(pluginRequired).every(field => {
    if (field === 'retire_date' && options.retirementFromBirthDate) return true
    const mapping = mappings[field]
    return mapping && IMPORT_FIELD_DEFINITIONS[field].mappingStrategies.includes(mapping.kind)
  })
}

/** Checks column-selection completeness before the mapping step begins. */
export function hasRequiredColumnMappings(
  columns: Readonly<Partial<Record<ImportField, string | null>>>,
  options: { readonly retirementFromBirthDate?: boolean, readonly pluginRequired?: readonly ImportField[] } = {},
): boolean {
  return requiredImportFields(options.pluginRequired).every(field =>
    field === 'retire_date' && options.retirementFromBirthDate
      ? true
      : Boolean(columns[field]),
  )
}

/** Converts and normalizes every persisted field at the shared pipeline boundary. */
export function normalizeMappedEntry(values: Readonly<Record<ImportField, string | undefined>>): Partial<SeniorityEntryInput> {
  return {
    seniority_number: values.seniority_number === undefined ? undefined : Number.parseInt(values.seniority_number, 10),
    employee_number: values.employee_number === undefined ? undefined : normalizeEmployeeNumber(values.employee_number),
    name: values.name,
    seat: values.seat?.toUpperCase(),
    base: values.base?.toUpperCase(),
    fleet: values.fleet?.toUpperCase(),
    hire_date: values.hire_date === undefined ? undefined : normalizeDate(values.hire_date),
    retire_date: values.retire_date === undefined ? undefined : normalizeDateFuture(values.retire_date),
  }
}

/** Validates a normalized draft using the domain schema owned by this registry. */
export function validateImportEntry(entry: Partial<SeniorityEntryInput>) {
  return SeniorityEntrySchema.safeParse(entry)
}
