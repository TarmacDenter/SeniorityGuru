import { defineImportPlugin } from '../prepare-import'
import type { ImportField, ImportIssue, ImportPlugin, PreparedColumn, PreparationPatch, SourceColumn, SourceSheet } from '../types'

const FIELD_ALIASES: Readonly<Record<ImportField, readonly string[]>> = {
  seniority_number: ['seniority number', 'seniority', 'sen #', 'sen num', 'sen_num'],
  employee_number: ['employee number', 'employee id', 'employee', 'emp id', 'emp_id', 'empid'],
  name: ['name', 'pilot name', 'full name'],
  seat: ['seat', 'position', 'pos', 'status'],
  base: ['base', 'domicile', 'dom', 'station'],
  fleet: ['fleet', 'equipment', 'equip', 'aircraft', 'acft', 'ac type'],
  hire_date: ['hire date', 'hire', 'hire_date', 'doh', 'date of hire'],
  retire_date: ['retire date', 'retirement date', 'retire', 'retirement', 'retire_date'],
}

const FIELD_LABELS: Readonly<Record<ImportField, string>> = {
  seniority_number: 'Seniority Number',
  employee_number: 'Employee Number',
  name: 'Name',
  seat: 'Seat',
  base: 'Base',
  fleet: 'Fleet',
  hire_date: 'Hire Date',
  retire_date: 'Retire Date',
}

function normalizeHeader(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s_\-./]+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim()
}

function matchingColumns(columns: readonly SourceColumn[], aliases: readonly string[]): SourceColumn[] {
  const normalizedAliases = new Set(aliases.map(normalizeHeader))
  return columns.filter(column => column.label !== null && normalizedAliases.has(normalizeHeader(column.label)))
}

function canonicalColumnId(field: ImportField): string {
  return `plugin:generic:${field.replace(/_/g, '-')}`
}

function prepare(sourceSheet: SourceSheet): PreparationPatch {
  const columns: PreparedColumn[] = []
  const mappingSuggestions: Partial<Record<ImportField, string>> = {}
  const issues: ImportIssue[] = []

  for (const field of Object.keys(FIELD_ALIASES) as ImportField[]) {
    const matches = matchingColumns(sourceSheet.columns, FIELD_ALIASES[field])
    if (matches.length === 1) {
      const id = canonicalColumnId(field)
      columns.push({ id, label: FIELD_LABELS[field], sourceColumnId: matches[0]!.id })
      mappingSuggestions[field] = id
    } else if (matches.length > 1) {
      issues.push({
        kind: 'ambiguous-alias',
        field,
        message: `More than one column looks like ${FIELD_LABELS[field]}. Choose the correct column.`,
      })
    }
  }

  return { columns, mappingSuggestions, issues }
}

/** The explicit Upload Type for spreadsheets without airline-specific preparation. */
export const genericImportPlugin: ImportPlugin = defineImportPlugin({
  id: 'generic',
  label: 'Generic spreadsheet',
  description: 'Map columns from a standard CSV, XLSX, or XLS spreadsheet.',
  prepare,
})
