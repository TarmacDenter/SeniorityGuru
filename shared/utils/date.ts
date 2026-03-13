import { EXCEL_EPOCH_MS } from '#shared/constants'

/** Format a Date to YYYY-MM-DD string */
export function formatDate(d: Date, utc = false): string {
  const y = utc ? d.getUTCFullYear() : d.getFullYear()
  const m = String((utc ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0')
  const day = String(utc ? d.getUTCDate() : d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse an Excel serial number (e.g. 40193) into YYYY-MM-DD, or null if invalid */
export function parseExcelSerial(serial: number): string | null {
  const ms = EXCEL_EPOCH_MS + serial * 86400000
  const date = new Date(ms)
  if (isNaN(date.getTime())) return null
  return formatDate(date, true)
}

/** Parse MM/DD/YYYY or MM-DD-YYYY (with 1-2 digit month/day, 2-4 digit year) into YYYY-MM-DD, or null */
export function parseSlashDate(s: string): string | null {
  const match = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (!match) return null
  const [, m, d] = match
  let y = match[3]
  if (y!.length === 2) y = (parseInt(y!, 10) > 50 ? '19' : '20') + y
  return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`
}

/**
 * Normalize a date string from common formats into YYYY-MM-DD.
 * Supported: YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, M/D/YY, Excel serials, named months.
 * Returns the original string if unparseable.
 */
export function normalizeDate(value: string): string {
  const s = value.trim()
  if (!s) return s

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // Excel serial (4-6 digit pure number)
  if (/^\d{4,6}$/.test(s)) {
    const result = parseExcelSerial(parseInt(s, 10))
    if (result) return result
  }

  // Slash/dash date
  const slashResult = parseSlashDate(s)
  if (slashResult) return slashResult

  // Named month ("15 Jan 2010", "Jan 15, 2010", etc.)
  const parsed = new Date(s)
  if (!isNaN(parsed.getTime()) && s.match(/[a-zA-Z]/)) {
    return formatDate(parsed)
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
