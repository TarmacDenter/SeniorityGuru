import { EXCEL_EPOCH_MS } from '#shared/constants'

/** Format a Date to YYYY-MM-DD string */
export function formatDate(d: Date, utc = false): string {
  const y = utc ? d.getUTCFullYear() : d.getFullYear()
  const m = String((utc ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0')
  const day = String(utc ? d.getUTCDate() : d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Check that year/month/day form a real calendar date. Year must be 1900–2099. */
export function isValidCalendarDate(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 2099) return false
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y
    && date.getUTCMonth() === m - 1
    && date.getUTCDate() === d
  )
}

/** Parse an Excel serial number (e.g. 40193) into YYYY-MM-DD, or null if invalid */
export function parseExcelSerial(serial: number): string | null {
  const ms = EXCEL_EPOCH_MS + serial * 86400000
  const date = new Date(ms)
  if (isNaN(date.getTime())) return null
  return formatDate(date, true)
}

/**
 * Parse MM/DD/YYYY, MM-DD-YYYY, or MM.DD.YYYY (with 1-2 digit month/day, 2 or 4 digit year)
 * into YYYY-MM-DD, or null if invalid.
 *
 * Assumes US date order (month/day/year) for ambiguous inputs.
 */
export function parseSlashDate(s: string): string | null {
  const match = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (!match) return null
  const [, mStr, dStr, yStr] = match
  let year = yStr!
  if (year.length === 2) year = (parseInt(year, 10) > 50 ? '19' : '20') + year
  const y = parseInt(year, 10)
  const m = parseInt(mStr!, 10)
  const d = parseInt(dStr!, 10)
  if (!isValidCalendarDate(y, m, d)) return null
  return `${year}-${mStr!.padStart(2, '0')}-${dStr!.padStart(2, '0')}`
}

/**
 * Normalize a date string from common formats into YYYY-MM-DD.
 *
 * Supported formats:
 * - YYYY-MM-DD (ISO passthrough, validated)
 * - YYYY-MM-DDT... (ISO datetime — time portion stripped)
 * - YYYY/MM/DD or YYYY.MM.DD (year-first with slash/dot)
 * - MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY, M/D/YY (US date order assumed)
 * - Excel serial numbers (4–6 digit integers, e.g. "40193")
 * - Named months ("15 Jan 2010", "Jan 15, 2010", etc.)
 *
 * Returns the original string if unparseable (triggers downstream validation error).
 */
export function normalizeDate(value: string): string {
  const s = value.trim()
  if (!s) return s

  // Already ISO — validate that it's a real calendar date
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    if (isValidCalendarDate(y!, m!, d!)) return s
    return s // invalid but return as-is for downstream error reporting
  }

  // ISO datetime with time component (e.g. "2010-01-15T00:00:00Z", "2010-01-15 12:00")
  if (/^\d{4}-\d{2}-\d{2}[T ]/.test(s)) {
    const datePart = s.slice(0, 10)
    const [y, m, d] = datePart.split('-').map(Number)
    if (isValidCalendarDate(y!, m!, d!)) return datePart
  }

  // Year-first with slash or dot (YYYY/MM/DD or YYYY.MM.DD)
  const yFirstMatch = s.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/)
  if (yFirstMatch) {
    const [, yStr, mStr, dStr] = yFirstMatch
    const y = parseInt(yStr!, 10)
    const m = parseInt(mStr!, 10)
    const d = parseInt(dStr!, 10)
    if (isValidCalendarDate(y, m, d)) {
      return `${yStr}-${mStr!.padStart(2, '0')}-${dStr!.padStart(2, '0')}`
    }
  }

  // Excel serial (4-6 digit pure number)
  if (/^\d{4,6}$/.test(s)) {
    const result = parseExcelSerial(parseInt(s, 10))
    if (result) return result
  }

  // Slash/dash/dot date (MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY, M/D/YY)
  const slashResult = parseSlashDate(s)
  if (slashResult) return slashResult

  // Named month ("15 Jan 2010", "Jan 15, 2010", etc.) — force UTC to avoid timezone shift
  if (s.match(/[a-zA-Z]/)) {
    const parsed = new Date(s + ' UTC')
    if (!isNaN(parsed.getTime())) {
      return formatDate(parsed, true)
    }
    // Fallback: try without appending UTC (some formats may not accept it)
    const fallback = new Date(s)
    if (!isNaN(fallback.getTime())) {
      return formatDate(fallback, true)
    }
  }

  return s
}

/** Compute retirement date from DOB + policy age. Handles leap day DOBs. */
export function computeRetireDate(dob: string, retirementAge: number): string {
  const date = new Date(dob + 'T00:00:00')
  const dobMonth = date.getMonth()
  date.setFullYear(date.getFullYear() + retirementAge)
  if (dobMonth === 1 && date.getMonth() !== 1) {
    date.setDate(0)
  }
  return date.toISOString().slice(0, 10)
}
