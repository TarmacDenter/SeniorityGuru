import { defineImportPlugin } from '../prepare-import'
import type { ImportField, ImportPlugin, PreparationPatch, SourceSheet } from '../types'

const UNKNOWN_RETIRE_SENTINEL = '2099-12-31'
const HEADER_MARKER = 'SENIORITY_NBR'
const headerFields: Readonly<Record<string, ImportField>> = {
  SENIORITY_NBR: 'seniority_number',
  EMP_NBR: 'employee_number',
  NAME: 'name',
  PILOT_HIRE_DATE: 'hire_date',
  SCHEDULED_RETIRE_DATE: 'retire_date',
}
const labels: Readonly<Record<ImportField, string>> = {
  seniority_number: 'Seniority Number', employee_number: 'Employee Number', name: 'Name',
  seat: 'Seat', base: 'Base', fleet: 'Fleet', hire_date: 'Hire Date', retire_date: 'Retire Date',
}

export function mapDeltaSeat(code: string): string {
  return ({ A: 'CA', B: 'FO' } as Record<string, string>)[code] ?? code
}

export function decomposeDeltaCategory(category: string): { base: string, fleet: string, seat: string } {
  const value = category.trim() || 'NBCNEWB'
  return { base: value.slice(0, 3), fleet: value.slice(3, 6), seat: mapDeltaSeat(value.slice(6, 7)) }
}

function id(field: ImportField) { return `plugin:delta:${field.replace(/_/g, '-')}` }

function headerIndex(sourceSheet: SourceSheet): number | undefined {
  const index = sourceSheet.rows.findIndex(row => row.cells.some(cell => String(cell ?? '').trim() === HEADER_MARKER))
  return index === -1 ? undefined : index
}

function prepare(sourceSheet: SourceSheet): PreparationPatch {
  const columns = [] as NonNullable<PreparationPatch['columns']>[number][]
  const mappingSuggestions: Partial<Record<ImportField, string>> = {}
  const cellValues: Record<string, Record<string, string>> = {}
  let categoryIndex = -1

  sourceSheet.columns.forEach((column, index) => {
    const key = column.label?.trim().toUpperCase() ?? ''
    if (key === 'CATEGORY') categoryIndex = index
    const field = headerFields[key]
    if (!field) return
    const columnId = id(field)
    columns.push({ id: columnId, label: labels[field], sourceColumnId: column.id })
    mappingSuggestions[field] = columnId
  })

  if (categoryIndex >= 0) {
    for (const field of ['base', 'fleet', 'seat'] as const) cellValues[id(field)] = {}
    for (const row of sourceSheet.rows) {
      const parts = decomposeDeltaCategory(String(row.cells[categoryIndex] ?? ''))
      cellValues[id('base')][row.id] = parts.base
      cellValues[id('fleet')][row.id] = parts.fleet
      cellValues[id('seat')][row.id] = parts.seat
    }
    for (const field of ['base', 'fleet', 'seat'] as const) {
      const columnId = id(field)
      columns.push({ id: columnId, label: labels[field] })
      mappingSuggestions[field] = columnId
    }
  }
  return { columns, cellValues, mappingSuggestions }
}

export const deltaImportPlugin: ImportPlugin = defineImportPlugin({
  id: 'delta',
  label: 'Delta Air Lines',
  description: 'Delta PBS seniority list export with Category column.',
  icon: 'i-lucide-graduation-cap',
  formatDescription: 'Expects a Delta PBS seniority list export. Category values create Base, Fleet, and Seat fields automatically.',
  suggestHeaderRow: headerIndex,
  prepare,
  transformMappedEntry: ({ draft }) => draft.entry.retire_date === '.' || !draft.entry.retire_date
    ? { entry: { retire_date: UNKNOWN_RETIRE_SENTINEL } }
    : {},
})
