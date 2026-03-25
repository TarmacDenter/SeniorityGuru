import type { PreParser, PreParserResult, PreParserMetadata } from './types'
import { normalizeDate } from '~/utils/date'

const UNKNOWN_RETIRE_SENTINEL = '2099-12-31'

const SEAT_MAP: Record<string, string> = { A: 'CA', B: 'FO' }

export function mapSeatCode(code: string): string {
  return SEAT_MAP[code] ?? code
}

export function decomposeCategory(category: string): { base: string; fleet: string; seat: string } {
  const normalized = category.trim() || 'NBCNEWB'
  return {
    base: normalized.slice(0, 3),
    fleet: normalized.slice(3, 6),
    seat: mapSeatCode(normalized.slice(6, 7)),
  }
}

const DELTA_HEADER_MARKER = 'SENIORITY_NBR'

const HEADER_MAP: Record<string, string> = {
  SENIORITY_NBR: 'Seniority Number',
  Emp_Nbr: 'Employee Number',
  Name: 'Name',
  Pilot_Hire_Date: 'Hire Date',
  Scheduled_Retire_Date: 'Retire Date',
}

function findHeaderRow(raw: string[][]): number {
  return raw.findIndex(row => row.some(cell => String(cell).trim() === DELTA_HEADER_MARKER))
}

function extractMetadata(preamble: string[][]): { effectiveDate: string | null; title: string | null } {
  for (const row of preamble) {
    const cell = String(row[0] ?? '').trim()
    const match = cell.match(/Seniority\s+List\s+(\d{2}[A-Za-z]{3}\d{4})/i)
    if (match) {
      return {
        effectiveDate: normalizeDate(match[1]!),
        title: cell,
      }
    }
  }
  return { effectiveDate: null, title: null }
}

export const deltaParser: PreParser = {
  id: 'delta',
  label: 'Delta Air Lines',
  description: 'Delta PBS seniority list export with Category column.',
  icon: 'i-lucide-graduation-cap',
  formatDescription: 'Expects a Delta Air Lines PBS seniority list export. Columns: SENIORITY_NBR, Emp_Nbr, Name, Category, Pilot_Hire_Date, Scheduled_Retire_Date. The Category column (e.g. ATL350A) is automatically split into Base, Fleet, and Seat. Preamble rows before the header are skipped automatically.',

  parse(raw: string[][]): PreParserResult {
    const headerIdx = findHeaderRow(raw)
    if (headerIdx === -1) {
      return { rows: raw, metadata: { effectiveDate: null, title: null } }
    }

    const preamble = raw.slice(0, headerIdx)
    const metadata = extractMetadata(preamble)

    const originalHeaders = raw[headerIdx]!
    const catIdx = originalHeaders.findIndex(h => String(h).trim().toLowerCase() === 'category')

    const standardHeaders: string[] = []
    const sourceIndices: number[] = []
    for (let i = 0; i < originalHeaders.length; i++) {
      const header = String(originalHeaders[i]).trim()
      if (header.toLowerCase() === 'category') continue
      const mapped = HEADER_MAP[header] ?? header
      standardHeaders.push(mapped)
      sourceIndices.push(i)
    }
    standardHeaders.push('Base', 'Fleet', 'Seat')

    const retireHeaderIdx = standardHeaders.indexOf('Retire Date')

    const syntheticIndices: number[] = []
    const dataRows = raw.slice(headerIdx + 1).filter(row => row.some(cell => String(cell).trim() !== ''))
    const transformedRows = dataRows.map((row, rowIdx) => {
      const mapped = sourceIndices.map(i => String(row[i] ?? ''))
      const cat = catIdx >= 0 ? String(row[catIdx] ?? '') : ''
      const { base, fleet, seat } = decomposeCategory(cat)
      mapped.push(base, fleet, seat)

      if (retireHeaderIdx >= 0) {
        const retireVal = mapped[retireHeaderIdx]?.trim()
        if (!retireVal || retireVal === '.') {
          mapped[retireHeaderIdx] = UNKNOWN_RETIRE_SENTINEL
          syntheticIndices.push(rowIdx)
        }
      }

      return mapped
    })

    const fullMetadata: PreParserMetadata = { ...metadata }
    if (syntheticIndices.length > 0) {
      fullMetadata.syntheticIndices = syntheticIndices
      fullMetadata.syntheticNote = `${syntheticIndices.length} row${syntheticIndices.length === 1 ? '' : 's'} had unknown retirement dates and were set to ${UNKNOWN_RETIRE_SENTINEL}. You can edit these in the review table.`
    }

    return {
      rows: [standardHeaders, ...transformedRows],
      metadata: fullMetadata,
    }
  },
}
