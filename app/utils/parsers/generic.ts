import type { PreParser, PreParserResult } from './types'
import { normalizeDate } from '~/utils/date'

const HEADER_THRESHOLD = 5

/** Count non-empty (after trim) cells in a row. */
export function countNonEmpty(row: string[]): number {
  return row.filter(cell => String(cell).trim() !== '').length
}

/**
 * Scan rows top-down, returning the index of the first row with
 * HEADER_THRESHOLD or more non-empty cells. Falls back to 0.
 */
export function findHeaderRow(rows: string[][]): number {
  const idx = rows.findIndex(row => countNonEmpty(row) >= HEADER_THRESHOLD)
  return idx === -1 ? 0 : idx
}

/**
 * A generic date regex that catches common date-like patterns in preamble text.
 * Matches patterns like: 01Mar2026, 2026-03-01, 03/15/2026, March 1 2026, etc.
 */
const DATE_PATTERN = /\b(\d{1,2}[A-Za-z]{3}\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})\b/

/**
 * Extract metadata (effective date, title) from preamble rows.
 * Scans each preamble row's first cell for a date-like string.
 */
export function extractMetadata(preamble: string[][]): { effectiveDate: string | null; title: string | null } {
  for (const row of preamble) {
    const cell = String(row[0] ?? '').trim()
    if (!cell) continue
    const match = cell.match(DATE_PATTERN)
    if (match) {
      const normalized = normalizeDate(match[1]!)
      // Only accept if normalizeDate produced a valid YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return { effectiveDate: normalized, title: cell }
      }
    }
  }
  return { effectiveDate: null, title: null }
}

export const genericParser: PreParser = {
  id: 'generic',
  label: 'Generic / Other Airline',
  description: 'Standard CSV or XLSX — first row is column headers.',
  icon: 'i-lucide-file-spreadsheet',
  formatDescription: 'Expects a standard spreadsheet where the first row contains column headers. Columns should be named to match: Seniority Number, Employee Number, Seat, Base, Fleet, Name, Hire Date, Retire Date — or you can map them manually in the next step.',
  parse(raw: string[][]): PreParserResult {
    if (raw.length === 0) {
      return { rows: raw, metadata: { effectiveDate: null, title: null } }
    }

    const headerIdx = findHeaderRow(raw)

    // No preamble detected — pass through unchanged
    if (headerIdx === 0) {
      return { rows: raw, metadata: { effectiveDate: null, title: null } }
    }

    const preamble = raw.slice(0, headerIdx)
    const metadata = extractMetadata(preamble)

    return {
      rows: raw.slice(headerIdx),
      metadata,
    }
  },
}
