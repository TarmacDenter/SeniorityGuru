import type { PreParser, PreParserResult } from './types'

export const genericParser: PreParser = {
  id: 'generic',
  label: 'Generic / Other Airline',
  description: 'Standard CSV or XLSX — first row is column headers.',
  icon: 'i-lucide-file-spreadsheet',
  formatDescription: 'Expects a standard spreadsheet where the first row contains column headers. Columns should be named to match: Seniority Number, Employee Number, Seat, Base, Fleet, Name, Hire Date, Retire Date — or you can map them manually in the next step.',
  parse(raw: string[][]): PreParserResult {
    return {
      rows: raw,
      metadata: { effectiveDate: null, title: null },
    }
  },
}
