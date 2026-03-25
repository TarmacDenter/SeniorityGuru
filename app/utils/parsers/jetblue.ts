import type { PreParser, PreParserResult } from './types'
import { createLogger } from '~/utils/logger'

const log = createLogger('parser:jetblue')

// ── Header detection ─────────────────────────────────────────────────────

const HEADER_ALIASES: Record<string, string[]> = {
  seniority:  ['SEN', 'SENIORITY', 'SEN_NO'],
  employee:   ['CMID', 'CREW_ID', 'EMP_ID'],
  name:       ['NAME', 'PILOT_NAME'],
  base:       ['BASE', 'DOMICILE'],
  fleet:      ['FLEET', 'EQUIP'],
  seat:       ['SEAT', 'POS'],
  hireDate:   ['HIREDATE', 'HIRE_DATE', 'DOH'],
  retireDate: ['RTRDATE', 'RTR_DATE', 'RETIRE_DATE', 'RET_DATE'],
  yrs2rtr:    ['YRS2RTR', 'YRS_TO_RTR'],
}

function matchesAlias(header: string, field: keyof typeof HEADER_ALIASES): boolean {
  return HEADER_ALIASES[field]!.some(
    alias => header.toUpperCase() === alias,
  )
}

function findHeaderRow(raw: string[][]): number {
  return raw.findIndex(row =>
    row.some(cell => matchesAlias(String(cell).trim(), 'seniority'))
    && row.some(cell => matchesAlias(String(cell).trim(), 'employee')),
  )
}

// ── Standard header mapping ──────────────────────────────────────────────

const STANDARD_NAMES: Record<string, string> = {
  SEN: 'Seniority Number',
  SENIORITY: 'Seniority Number',
  SEN_NO: 'Seniority Number',
  CMID: 'Employee Number',
  CREW_ID: 'Employee Number',
  EMP_ID: 'Employee Number',
  NAME: 'Name',
  PILOT_NAME: 'Name',
  BASE: 'Base',
  DOMICILE: 'Base',
  FLEET: 'Fleet',
  EQUIP: 'Fleet',
  SEAT: 'Seat',
  POS: 'Seat',
  HIREDATE: 'Hire Date',
  HIRE_DATE: 'Hire Date',
  DOH: 'Hire Date',
  RTRDATE: 'Retire Date',
  RTR_DATE: 'Retire Date',
  RETIRE_DATE: 'Retire Date',
  RET_DATE: 'Retire Date',
}

// Columns to drop from output
const DROP_COLUMNS = new Set(['YRS2RTR', 'YRS_TO_RTR'])

// ── Date normalization ───────────────────────────────────────────────────

/** Convert "M/D/YYYY" or "MM/DD/YYYY" → "YYYY-MM-DD". Passes through unrecognized formats. */
export function normalizeSlashDate(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return raw
  const month = match[1]!.padStart(2, '0')
  const day = match[2]!.padStart(2, '0')
  return `${match[3]}-${month}-${day}`
}

// ── Parser implementation ────────────────────────────────────────────────

export const jetblueParser: PreParser = {
  id: 'jetblue',
  label: 'JetBlue Airways',
  description: 'JetBlue ALPA seniority list with CMID and M/D/YYYY dates.',
  icon: 'i-lucide-plane',
  formatDescription:
    'Expects a JetBlue Airways ALPA seniority list export. Columns: SEN, CMID, NAME, '
    + 'BASE, FLEET, SEAT, HIREDATE, RTRDATE. Dates in M/D/YYYY format are converted '
    + 'automatically. The YRS2RTR column is dropped.',

  parse(raw: string[][]): PreParserResult {
    log.info('Starting parse', { totalRows: raw.length })

    const headerIdx = findHeaderRow(raw)

    if (headerIdx === -1) {
      log.warn('Header row not found — falling back to raw passthrough', {
        firstRow: raw[0]?.slice(0, 5),
      })
      return { rows: raw, metadata: { effectiveDate: null, title: null } }
    }

    log.debug('Header found', { headerIdx, headerRow: raw[headerIdx] })

    const originalHeaders = raw[headerIdx]!

    // Build new header row — rename known columns, drop YRS2RTR
    const standardHeaders: string[] = []
    const sourceIndices: number[] = []

    for (let i = 0; i < originalHeaders.length; i++) {
      const header = String(originalHeaders[i]).trim().toUpperCase()
      if (DROP_COLUMNS.has(header)) continue

      const standardName = STANDARD_NAMES[header]
      if (!standardName) {
        log.debug('Unmapped header passed through as-is', { header })
      }
      standardHeaders.push(standardName ?? String(originalHeaders[i]).trim())
      sourceIndices.push(i)
    }

    // Find date column indices in the NEW header array
    const hireDateIdx = standardHeaders.indexOf('Hire Date')
    const retireDateIdx = standardHeaders.indexOf('Retire Date')

    let dateNormalizationFailures = 0

    // Transform data rows
    const dataRows = raw
      .slice(headerIdx + 1)
      .filter(row => row.some(cell => String(cell).trim() !== ''))

    const transformedRows = dataRows.map((row) => {
      const mapped = sourceIndices.map(i => String(row[i] ?? ''))

      // Normalize dates
      if (hireDateIdx >= 0 && mapped[hireDateIdx]) {
        const original = mapped[hireDateIdx]!
        mapped[hireDateIdx] = normalizeSlashDate(original)
        if (mapped[hireDateIdx] === original && !/^\d{4}-\d{2}-\d{2}$/.test(original)) {
          dateNormalizationFailures++
        }
      }
      if (retireDateIdx >= 0 && mapped[retireDateIdx]) {
        const original = mapped[retireDateIdx]!
        mapped[retireDateIdx] = normalizeSlashDate(original)
        if (mapped[retireDateIdx] === original && !/^\d{4}-\d{2}-\d{2}$/.test(original)) {
          dateNormalizationFailures++
        }
      }

      return mapped
    })

    if (dateNormalizationFailures > 0) {
      log.warn('Some dates did not match expected M/D/YYYY format', {
        failureCount: dateNormalizationFailures,
        hint: 'These will surface as validation errors in the review step',
      })
    }

    log.info('Parse complete', {
      dataRows: transformedRows.length,
      standardColumns: standardHeaders.length,
    })

    return {
      rows: [standardHeaders, ...transformedRows],
      metadata: { effectiveDate: null, title: null },
    }
  },
}
