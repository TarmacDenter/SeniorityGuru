import { defineImportPlugin } from '../prepare-import'
import { IMPORT_FIELDS, importFieldLabel } from '../fields'
import type { ImportField, ImportIssue, ImportPlugin, PreparedColumn, PreparationPatch, SourceSheet } from '../types'
import { matchingColumns, preparedColumn, preparedColumnId } from './aliases'

const FIELD_ALIASES: Readonly<Record<ImportField, readonly string[]>> = {
  seniority_number: ['seniority number', 'seniority', 'sen #', 'sen num', 'sen_num', 'sen no', 'sen number', 'seniority no', 'seniority num', 'seniority nbr', 'snr'],
  employee_number: ['employee number', 'employee id', 'employee', 'emp id', 'emp_id', 'empid', 'emp no', 'empno', 'emp num', 'emp number', 'employee no', 'employee nbr', 'file number', 'file no', 'cmid', 'crew id', 'crewmember id', 'pilot id'],
  name: ['name', 'pilot name', 'full name', 'employee name', 'crewmember name', 'crew name'],
  seat: ['seat', 'position', 'pos', 'status', 'crew position'],
  base: ['base', 'domicile', 'dom', 'station', 'crew base', 'home base'],
  fleet: ['fleet', 'equipment', 'equip', 'aircraft', 'acft', 'ac type', 'a/c', 'aircraft type', 'equipment type', 'equip type'],
  hire_date: ['hire date', 'hire', 'hire_date', 'doh', 'date of hire', 'hiredate', 'hire dt', 'date hired'],
  retire_date: ['retire date', 'retirement date', 'retire', 'retirement', 'retire_date', 'rtrdate', 'rtr date', 'rtr', 'retdate', 'ret date', 'retire dt', 'retirement dt'],
}


function prepare(sourceSheet: SourceSheet): PreparationPatch {
  const columns: PreparedColumn[] = []
  const mappingSuggestions: Partial<Record<ImportField, string>> = {}
  const issues: ImportIssue[] = []

  for (const field of IMPORT_FIELDS) {
    const matches = matchingColumns(sourceSheet.columns, FIELD_ALIASES[field])
    if (matches.length === 1) {
      const id = preparedColumnId('generic', field)
      columns.push(preparedColumn('generic', field, matches[0]!.id))
      mappingSuggestions[field] = id
    } else if (matches.length > 1) {
      issues.push({
        kind: 'ambiguous-alias',
        field,
        message: `More than one column looks like ${importFieldLabel(field)}. Choose the correct column.`,
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
