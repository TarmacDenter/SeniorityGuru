/** Side-effect-free Temporal boundary for application code. */
import { Temporal } from 'temporal-polyfill'

export { Temporal }
export type PlainDate = Temporal.PlainDate
export type Instant = Temporal.Instant

export function parsePlainDate(value: string): PlainDate {
  return Temporal.PlainDate.from(value)
}

export function serializePlainDate(value: PlainDate): string {
  return value.toString()
}

export function todayPlainDate(): PlainDate {
  const now = new Date(Date.now())
  return Temporal.PlainDate.from({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
}

export function parseInstant(value: string): Instant {
  return Temporal.Instant.from(value)
}

/** Durable timestamp format retained for existing IndexedDB records. */
export function serializeInstant(value: Instant): string {
  return value.toString({ smallestUnit: 'millisecond' })
}

export function nowInstant(): Instant {
  return Temporal.Now.instant()
}

export function formatInstantLocal(value: Instant): string {
  return value.toZonedDateTimeISO(Temporal.Now.timeZoneId()).toLocaleString()
}

/** Add local calendar days, preserving the intended local deadline. */
export function addLocalCalendarDays(value: Instant, days: number): Instant {
  const zone = Temporal.Now.timeZoneId()
  return value.toZonedDateTimeISO(zone).add({ days }).toInstant()
}
