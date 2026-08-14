import { defineImportPlugin } from '../prepare-import'
import { IMPORT_FIELDS } from '../fields'
import type { ImportField, ImportPlugin, PreparedColumn, PreparationPatch, SourceSheet } from '../types'
import { matchingColumns, preparedColumn, preparedColumnId, normalizeHeader } from './aliases'

const aliases: Readonly<Record<ImportField, readonly string[]>> = {
  seniority_number: ['SEN', 'SENIORITY', 'SEN_NO'], employee_number: ['CMID', 'CREW_ID', 'EMP_ID'],
  name: ['NAME', 'PILOT_NAME'], base: ['BASE', 'DOMICILE'], fleet: ['FLEET', 'EQUIP'],
  seat: ['SEAT', 'POS'], hire_date: ['HIREDATE', 'HIRE_DATE', 'DOH'],
  retire_date: ['RTRDATE', 'RTR_DATE', 'RETIRE_DATE', 'RET_DATE'],
}
function normalize(value: string) { return normalizeHeader(value).toUpperCase() }

function headerIndex(sourceSheet: SourceSheet): number | undefined {
  const index = sourceSheet.rows.findIndex(row => {
    const values = row.cells.map(value => normalize(String(value ?? '')))
    return values.some(value => aliases.seniority_number.includes(value)) && values.some(value => aliases.employee_number.includes(value))
  })
  return index === -1 ? undefined : index
}

function prepare(sourceSheet: SourceSheet): PreparationPatch {
  const columns: PreparedColumn[] = []
  const mappingSuggestions: Partial<Record<ImportField, string>> = {}
  for (const field of IMPORT_FIELDS) {
    const matches = matchingColumns(sourceSheet.columns, aliases[field])
    if (matches.length === 1) {
      const columnId = preparedColumnId('jetblue', field)
      columns.push(preparedColumn('jetblue', field, matches[0]!.id))
      mappingSuggestions[field] = columnId
    }
  }
  return { columns, mappingSuggestions }
}

export function hasJetBlueEuMarker(name: string): boolean {
  return /(?:^|\s)-EU(?=\s|$)/i.test(name)
}

export const jetblueImportPlugin: ImportPlugin = defineImportPlugin({
  id: 'jetblue',
  label: 'JetBlue Airways',
  description: 'JetBlue ALPA seniority list with CMID and M/D/YYYY dates.',
  icon: 'i-lucide-plane',
  formatDescription: 'Expects a JetBlue ALPA export with SEN, CMID, NAME, BASE, FLEET, SEAT, HIREDATE, and RTRDATE columns.',
  requiredMappings: ['name', 'base'],
  suggestHeaderRow: headerIndex,
  prepare,
  transformMappedEntry: ({ draft }) => {
    const name = typeof draft.entry.name === 'string' ? draft.entry.name : ''
    if (!name) return { issues: [{ kind: 'transformation-failed', field: 'name', message: 'A name is needed to determine JetBlue EU status.' }] }
    const base = typeof draft.entry.base === 'string' ? draft.entry.base.trim() : ''
    return hasJetBlueEuMarker(name) && !/-EU$/i.test(base)
      ? { entry: { base: `${base}-EU` } }
      : {}
  },
})
