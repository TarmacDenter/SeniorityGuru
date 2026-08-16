import { Temporal } from '~/utils/temporal'

export function isValidCalendarDate(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 2099) return false
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  try {
    Temporal.PlainDate.from({ year: y, month: m, day: d }, { overflow: 'reject' })
    return true
  } catch {
    return false
  }
}
