import { Temporal } from '~/utils/temporal'
import { toPlainDate } from './temporal'

/** Format a Date object as YYYY-MM-DD. */
export function formatDate(d: Temporal.PlainDate | string | Date, utc = false): string {
  if (d instanceof Date) {
    return Temporal.PlainDate.from({
      year: utc ? d.getUTCFullYear() : d.getFullYear(),
      month: (utc ? d.getUTCMonth() : d.getMonth()) + 1,
      day: utc ? d.getUTCDate() : d.getDate(),
    }).toString()
  }
  return toPlainDate(d).toString()
}

/** Format a YYYY-MM-DD string as "Jan 2026". */
export function formatMonthYear(dateStr: Temporal.PlainDate | string): string {
  return toPlainDate(dateStr).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

/** Extract the four-digit year from a YYYY-MM-DD string. */
export function formatYear(dateStr: Temporal.PlainDate | string): string {
  return String(toPlainDate(dateStr).year)
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(): string {
  return Temporal.Now.plainDateISO().toString()
}
