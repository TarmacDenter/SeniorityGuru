/**
 * # Date Module — `~/utils/date`
 *
 * Unified, timezone-naive date handling for SeniorityGuru. This is the **sole
 * owner of dayjs** in the codebase — no other file should import dayjs directly.
 *
 * ## Core principle
 *
 * All dates at module boundaries are **`YYYY-MM-DD` strings**. No `Date` objects,
 * no `Dayjs` objects leak out. Internally, dayjs.utc handles all parsing and math
 * so that calendar dates are never shifted by local timezone.
 *
 * ## Module structure
 *
 * ```
 * date/
 * ├── index.ts        ← barrel (this file) — public API only
 * ├── format.ts       ← display formatting (todayISO, formatMonthYear, …)
 * ├── math.ts         ← date arithmetic + domain helpers (diffYears, isRetiredBy, …)
 * ├── parse.ts        ← input normalization (normalizeDate, detectDateFormat)
 * ├── validate.ts     ← calendar validation (internal)
 * └── constants.ts    ← regex, epoch, format strings (internal)
 * ```
 *
 * Only exports listed below are public. Internal helpers (`isValidCalendarDate`,
 * `parseExcelSerial`, `parseSlashDate`, `DATE_PARSERS`, `NAMED_MONTH_FORMATS`)
 * are hidden behind the barrel.
 *
 * ## Usage categories
 *
 * ### Formatting — display dates to users
 * - {@link todayISO} — today as `YYYY-MM-DD`
 * - {@link formatMonthYear} — `'2026-01-15'` → `'Jan 2026'`
 * - {@link formatYear} — `'2026-01-15'` → `'2026'`
 * - {@link formatDate} — `Date` object → `YYYY-MM-DD` (legacy bridge)
 *
 * ### Math — date arithmetic for projections and analytics
 * - {@link diffYears} — fractional years between two dates
 * - {@link addYearsISO} — offset a date by N years
 * - {@link isRetiredBy} — has a pilot retired by a given date?
 * - {@link retiresInYear} — does a retire date fall in year X?
 * - {@link extractYear} — numeric year from ISO string (pure string op)
 * - {@link currentYear} — current calendar year as number
 * - {@link deriveAge} — approximate age from retire date + mandatory age
 * - {@link computeYOS} — years of service from hire date
 * - {@link computeRetireDate} — retirement date from DOB + age (leap-safe)
 *
 * ### Parsing — normalize messy input into ISO strings
 * - {@link normalizeDate} — any common format → `YYYY-MM-DD`
 * - {@link detectDateFormat} — batch-detect a column's format for performance
 *
 * ### Constants
 * - {@link ISO_DATE_REGEX} — `/^\d{4}-\d{2}-\d{2}$/`
 * - {@link EXCEL_EPOCH_MS} — Excel serial number epoch
 *
 * @module ~/utils/date
 */

// ── Formatting ──────────────────────────────────────────────────────────
export { formatDate, formatMonthYear, formatYear, todayISO } from './format'

// ── Math ────────────────────────────────────────────────────────────────
export {
  diffYears, deriveAge, computeYOS, computeRetireDate,
  isRetiredBy, extractYear, addYearsISO, retiresInYear, currentYear,
} from './math'

// ── Parsing ─────────────────────────────────────────────────────────────
export { normalizeDate, normalizeDateFuture, detectDateFormat, detectFutureDateFormat } from './parse'
export type { DateParser } from './parse'

// ── Constants ───────────────────────────────────────────────────────────
export { ISO_DATE_REGEX, EXCEL_EPOCH_MS } from './constants'
