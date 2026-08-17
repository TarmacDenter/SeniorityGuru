import { Temporal } from '~/utils/temporal'
import { ISO_DATE_REGEX, NAMED_MONTH_FORMATS } from './constants'
import { isValidCalendarDate } from './validate'

/** Parse an Excel serial number (e.g. 40193) into YYYY-MM-DD. */
export function parseExcelSerial(serial: number): string | null {
  try {
    return Temporal.PlainDate.from('1899-12-30').add({ days: serial }).toString()
  } catch {
    return null
  }
}

/** Assumes US date order (month/day/year) for ambiguous inputs. */
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
 * Like parseSlashDate but 2-digit years always resolve to 20xx.
 * Use for columns where dates are known to be in the future (e.g. retire dates).
 */
function parseSlashDateFuture(s: string): string | null {
  const match = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (!match) return null
  const [, mStr, dStr, yStr] = match
  let year = yStr!
  if (year.length === 2) year = '20' + year
  const y = parseInt(year, 10)
  const m = parseInt(mStr!, 10)
  const d = parseInt(dStr!, 10)
  if (!isValidCalendarDate(y, m, d)) return null
  return `${year}-${mStr!.padStart(2, '0')}-${dStr!.padStart(2, '0')}`
}

/**
 * Core normalization logic. `slashParser` controls 2-digit-year century behaviour.
 * Pre-condition: `s` is already trimmed and non-empty.
 */
function _normalizeDate(s: string, slashParser: (s: string) => string | null): string {
  // Already ISO YYYY-MM-DD
  if (ISO_DATE_REGEX.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    if (isValidCalendarDate(y!, m!, d!)) return s
    return s
  }

  // ISO datetime — strip time component
  if (/^\d{4}-\d{2}-\d{2}[T ]/.test(s)) {
    const datePart = s.slice(0, 10)
    const [y, m, d] = datePart.split('-').map(Number)
    if (isValidCalendarDate(y!, m!, d!)) return datePart
  }

  // Year-first: YYYY/MM/DD or YYYY.MM.DD
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

  // Excel serial number (4-6 digits)
  if (/^\d{4,6}$/.test(s)) {
    const result = parseExcelSerial(parseInt(s, 10))
    if (result) return result
  }

  // US date order: MM/DD/YYYY, M/D/YY (with custom century pivot)
  const slashResult = slashParser(s)
  if (slashResult) return slashResult

  // Compact DDMonYYYY (e.g. "27Sep1985", "01MAR2099")
  const compactMatch = s.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/)
  if (compactMatch) {
    const titleCase = `${compactMatch[1]}${compactMatch[2]![0]!.toUpperCase()}${compactMatch[2]!.slice(1).toLowerCase()}${compactMatch[3]}`
    const [, day, month, year] = titleCase.match(/^(\d{1,2})([A-Z][a-z]{2})(\d{4})$/) ?? []
    const parsed = parseNamedMonth(day, month, year)
    if (parsed) return parsed
  }

  // Named months ("15 Jan 2010", "Jan 15, 2010", etc.)
  if (/[a-zA-Z]/.test(s)) {
    const normalized = s.replace(/[A-Za-z]+/g, w =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    for (const fmt of NAMED_MONTH_FORMATS) {
      const parsed = parseNamedMonthText(normalized, fmt)
      if (parsed) return parsed
    }
  }

  return s
}

const MONTHS = new Map(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => [month, index + 1]))

function parseNamedMonth(day: string | undefined, month: string | undefined, year: string | undefined): string | null {
  if (!day || !month || !year) return null
  const monthNumber = MONTHS.get(month)
  const dayNumber = Number(day)
  const yearNumber = Number(year)
  if (!monthNumber || !isValidCalendarDate(yearNumber, monthNumber, dayNumber)) return null
  return `${year}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
}

function parseNamedMonthText(value: string, format: string): string | null {
  const match = format === 'D MMM YYYY' ? value.match(/^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/)
    : format === 'MMM D, YYYY' || format === 'MMMM D, YYYY'
      ? value.match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/)
      : value.match(/^(\d{1,2}) ([A-Z][a-z]+) (\d{4})$/)
  if (!match) return null
  const [, first, second, third] = match
  const month = MONTHS.get(first!) ?? MONTHS.get(first!.slice(0, 3))
  const monthName = month ? first!.slice(0, 3) : second
  const day = month ? second : first
  const year = third
  return parseNamedMonth(day, monthName, year)
}

/**
 * Normalize a date string from common formats into YYYY-MM-DD.
 *
 * Handles: ISO, ISO datetime, YYYY/MM/DD, MM/DD/YYYY, M/D/YY,
 * Excel serial numbers, compact DDMonYYYY, and named months ("15 Jan 2010").
 * Returns the original string if unparseable (triggers downstream validation).
 */
export function normalizeDate(value: string): string {
  const s = value.trim()
  return s ? _normalizeDate(s, parseSlashDate) : s
}

// ── Batch format detection ──────────────────────────────────────────────

export interface DateParser {
  name: string
  parse: (s: string) => string | null
}

const DATE_PARSERS: DateParser[] = [
  {
    name: 'ISO',
    parse: (s: string) => {
      if (ISO_DATE_REGEX.test(s)) {
        const [y, m, d] = s.split('-').map(Number)
        return isValidCalendarDate(y!, m!, d!) ? s : null
      }
      return null
    },
  },
  {
    name: 'ISO datetime',
    parse: (s: string) => {
      if (/^\d{4}-\d{2}-\d{2}[T ]/.test(s)) {
        const datePart = s.slice(0, 10)
        const [y, m, d] = datePart.split('-').map(Number)
        return isValidCalendarDate(y!, m!, d!) ? datePart : null
      }
      return null
    },
  },
  {
    name: 'year-first',
    parse: (s: string) => {
      const match = s.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/)
      if (!match) return null
      const [, yStr, mStr, dStr] = match
      const y = parseInt(yStr!, 10)
      const m = parseInt(mStr!, 10)
      const d = parseInt(dStr!, 10)
      if (!isValidCalendarDate(y, m, d)) return null
      return `${yStr}-${mStr!.padStart(2, '0')}-${dStr!.padStart(2, '0')}`
    },
  },
  {
    name: 'Excel serial',
    parse: (s: string) => /^\d{4,6}$/.test(s) ? parseExcelSerial(parseInt(s, 10)) : null,
  },
  {
    name: 'US slash',
    parse: parseSlashDate,
  },
  {
    name: 'compact DDMonYYYY',
    parse: (s: string) => {
      const m = s.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/)
      if (!m) return null
      const titleCase = `${m[1]}${m[2]![0]!.toUpperCase()}${m[2]!.slice(1).toLowerCase()}${m[3]}`
      const [, day, month, year] = titleCase.match(/^(\d{1,2})([A-Z][a-z]{2})(\d{4})$/) ?? []
      return parseNamedMonth(day, month, year)
    },
  },
  ...NAMED_MONTH_FORMATS.map(fmt => ({
    name: `named month (${fmt})`,
    parse: (s: string) => {
      return parseNamedMonthText(s, fmt)
    },
  })),
]

function _detectFormat(samples: string[], parsers: DateParser[]): DateParser | null {
  if (samples.length === 0) return null
  const trimmed = samples.map(s => s.trim()).filter(Boolean)
  if (trimmed.length === 0) return null
  for (const parser of parsers) {
    if (trimmed.every(s => parser.parse(s) !== null)) return parser
  }
  return null
}

/**
 * Detect the date format that successfully parses ALL samples.
 *
 * Tries each parser against every sample string. Returns the first parser
 * that parses all samples, or null if no single parser works for all.
 */
export function detectDateFormat(samples: string[]): DateParser | null {
  return _detectFormat(samples, DATE_PARSERS)
}

// ── Future-biased parsing (for retire date columns) ──────────────────────

/** DATE_PARSERS variant where the US slash parser always maps 2-digit years to 20xx. */
const FUTURE_DATE_PARSERS: DateParser[] = DATE_PARSERS.map(p =>
  p.name === 'US slash' ? { name: 'US slash (future)', parse: parseSlashDateFuture } : p,
)

/**
 * Like detectDateFormat but treats 2-digit slash-separated years as 20xx.
 * Use for columns where dates are known to be in the future, such as retire dates.
 * Pilots retiring after 2050 have 2-digit years > 50 which the standard pivot
 * would incorrectly map to 1950s–1990s.
 */
export function detectFutureDateFormat(samples: string[]): DateParser | null {
  return _detectFormat(samples, FUTURE_DATE_PARSERS)
}

/**
 * Like normalizeDate but treats 2-digit slash-separated years as 20xx.
 * Use for date values known to be in the future, such as retire dates.
 */
export function normalizeDateFuture(value: string): string {
  const s = value.trim()
  return s ? _normalizeDate(s, parseSlashDateFuture) : s
}
