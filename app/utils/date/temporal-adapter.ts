import type { DateValue } from 'reka-ui'
import { parseDate } from '@internationalized/date'
import { Temporal } from '~/utils/temporal'

/** Adapter for Nuxt UI controls. The public model remains PlainDate. */
export function plainDateToDateValue(value: Temporal.PlainDate | null): DateValue | undefined {
  return value ? parseDate(value.toString()) : undefined
}

export function dateValueToPlainDate(value: DateValue | null | undefined): Temporal.PlainDate | null {
  return value ? Temporal.PlainDate.from(value.toString()) : null
}
