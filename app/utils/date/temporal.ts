import { Temporal, type PlainDate } from '~/utils/temporal'

export function toPlainDate(value: PlainDate | string): PlainDate {
  return typeof value === 'string' ? Temporal.PlainDate.from(value) : value
}

export function diffPlainDateYears(earlier: PlainDate, later: PlainDate): number {
  return later.since(earlier, { largestUnit: 'days' }).total({ unit: 'year', relativeTo: earlier })
}

export function addPlainDateYears(value: PlainDate, years: number): PlainDate {
  return value.add({ years })
}

export function isPlainDateOnOrBefore(value: PlainDate, asOfDate: PlainDate): boolean {
  return Temporal.PlainDate.compare(value, asOfDate) <= 0
}

export function retiresWithinNextYearPlainDate(retireDate: PlainDate, fromDate: PlainDate): boolean {
  return Temporal.PlainDate.compare(retireDate, fromDate) > 0
    && Temporal.PlainDate.compare(retireDate, fromDate.add({ years: 1 })) <= 0
}
