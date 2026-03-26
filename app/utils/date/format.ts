import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

/** Format a Date object as YYYY-MM-DD. */
export function formatDate(d: Date, utc = false): string {
  return (utc ? dayjs.utc(d) : dayjs(d)).format('YYYY-MM-DD')
}

/** Format a YYYY-MM-DD string as "Jan 2026". */
export function formatMonthYear(dateStr: string): string {
  return dayjs.utc(dateStr).format('MMM YYYY')
}

/** Extract the four-digit year from a YYYY-MM-DD string. */
export function formatYear(dateStr: string): string {
  return dayjs.utc(dateStr).format('YYYY')
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD')
}
