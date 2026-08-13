import type { ImportField, PreparedColumn, SourceColumn } from '../types'

export const FIELD_LABELS: Readonly<Record<ImportField, string>> = {
  seniority_number: 'Seniority Number', employee_number: 'Employee Number', name: 'Name',
  seat: 'Seat', base: 'Base', fleet: 'Fleet', hire_date: 'Hire Date', retire_date: 'Retire Date',
}

/** Normalizes complete spreadsheet headings without attempting fuzzy matching. */
export function normalizeHeader(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s_\-./]+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim()
}

export function preparedColumnId(pluginId: string, field: ImportField): string {
  return `plugin:${pluginId}:${field.replace(/_/g, '-')}`
}

export function matchingColumns(columns: readonly SourceColumn[], aliases: readonly string[]): SourceColumn[] {
  const normalizedAliases = new Set(aliases.map(normalizeHeader))
  return columns.filter(column => column.label !== null && normalizedAliases.has(normalizeHeader(column.label)))
}

export function preparedColumn(pluginId: string, field: ImportField, sourceColumnId?: string): PreparedColumn {
  return { id: preparedColumnId(pluginId, field), label: FIELD_LABELS[field], ...(sourceColumnId ? { sourceColumnId } : {}) }
}
