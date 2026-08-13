import { defineImportPlugin } from '../prepare-import'
import type { ImportField, ImportIssue, ImportPlugin, PreparedColumn, PreparationPatch, SourceSheet } from '../types'
import { FIELD_LABELS, matchingColumns, preparedColumn, preparedColumnId } from './aliases'

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


function prepare(sourceSheet: SourceSheet): PreparationPatch {
  const columns: PreparedColumn[] = []
  const mappingSuggestions: Partial<Record<ImportField, string>> = {}
  const issues: ImportIssue[] = []

  for (const field of Object.keys(FIELD_ALIASES) as ImportField[]) {
    const matches = matchingColumns(sourceSheet.columns, FIELD_ALIASES[field])
    if (matches.length === 1) {
      const id = preparedColumnId('generic', field)
      columns.push(preparedColumn('generic', field, matches[0]!.id))
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
  icon: 'i-lucide-sheet',
  formatDescription: 'Use this option for a spreadsheet with recognizable pilot columns. You can match every column manually.',
  prepare,
})
