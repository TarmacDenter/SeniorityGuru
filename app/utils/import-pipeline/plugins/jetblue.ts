import { defineImportPlugin } from '../prepare-import'
import type { ImportField, ImportPlugin, PreparationPatch, SourceSheet } from '../types'

const aliases: Readonly<Record<ImportField, readonly string[]>> = {
  seniority_number: ['SEN', 'SENIORITY', 'SEN_NO'], employee_number: ['CMID', 'CREW_ID', 'EMP_ID'],
  name: ['NAME', 'PILOT_NAME'], base: ['BASE', 'DOMICILE'], fleet: ['FLEET', 'EQUIP'],
  seat: ['SEAT', 'POS'], hire_date: ['HIREDATE', 'HIRE_DATE', 'DOH'],
  retire_date: ['RTRDATE', 'RTR_DATE', 'RETIRE_DATE', 'RET_DATE'],
}
const labels: Readonly<Record<ImportField, string>> = {
  seniority_number: 'Seniority Number', employee_number: 'Employee Number', name: 'Name', seat: 'Seat',
  base: 'Base', fleet: 'Fleet', hire_date: 'Hire Date', retire_date: 'Retire Date',
}

function normalize(value: string) { return value.trim().toUpperCase() }
function id(field: ImportField) { return `plugin:jetblue:${field.replace(/_/g, '-')}` }

function headerIndex(sourceSheet: SourceSheet): number | undefined {
  const index = sourceSheet.rows.findIndex(row => {
    const values = row.cells.map(value => normalize(String(value ?? '')))
    return values.some(value => aliases.seniority_number.includes(value)) && values.some(value => aliases.employee_number.includes(value))
  })
  return index === -1 ? undefined : index
}

function prepare(sourceSheet: SourceSheet): PreparationPatch {
  const columns = [] as NonNullable<PreparationPatch['columns']>[number][]
  const mappingSuggestions: Partial<Record<ImportField, string>> = {}
  for (const field of Object.keys(aliases) as ImportField[]) {
    const matches = sourceSheet.columns.filter(column => column.label && aliases[field].includes(normalize(column.label)))
    if (matches.length === 1) {
      const columnId = id(field)
      columns.push({ id: columnId, label: labels[field], sourceColumnId: matches[0]!.id })
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
  suggestHeaderRow: headerIndex,
  prepare,
  transformMappedEntry: ({ draft }) => {
    const name = typeof draft.entry.name === 'string' ? draft.entry.name : ''
    if (!name) return { issues: [{ kind: 'transformation-failed' as const, field: 'name' as const, message: 'A name is needed to determine JetBlue EU status.' }] }
    const base = typeof draft.entry.base === 'string' ? draft.entry.base.trim() : ''
    return hasJetBlueEuMarker(name) && !/-EU$/i.test(base)
      ? { entry: { base: `${base}-EU` } }
      : {}
  },
})
