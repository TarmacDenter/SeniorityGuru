import { Temporal } from '~/utils/temporal'
import type { PlainDate } from '~/utils/temporal'
import { addPlainDateYears, diffPlainDateYears, isPlainDateOnOrBefore, retiresWithinNextYearPlainDate, toPlainDate } from './temporal'

/** Fractional years between two dates. Accepts ISO strings or Date objects. */
export function diffYears(earlier: string | Date | PlainDate, later: string | Date | PlainDate): number {
  const earlierDate = typeof earlier === 'string'
    ? toPlainDate(earlier)
    : earlier instanceof Date
      ? Temporal.PlainDate.from(earlier.toISOString().slice(0, 10))
      : earlier
  const laterDate = typeof later === 'string'
    ? toPlainDate(later)
    : later instanceof Date
      ? Temporal.PlainDate.from(later.toISOString().slice(0, 10))
      : later
  return diffPlainDateYears(earlierDate, laterDate)
}

/** Back-calculate approximate current age from retirement date and mandatory retirement age. */
export function deriveAge(retireDate: string, mandatoryAge: number, asOfDate: PlainDate): number {
  const birthDate = toPlainDate(retireDate).subtract({ years: mandatoryAge })
  return Math.floor(diffPlainDateYears(birthDate, asOfDate))
}

/** Years of service from hire date to now. */
export function computeYOS(hireDateStr: string | PlainDate, asOfDate: PlainDate): number {
  return diffPlainDateYears(toPlainDate(hireDateStr), asOfDate)
}

/** True if retireDate is on or before asOfDate. Both are YYYY-MM-DD strings. */
export function isRetiredBy(retireDate: string | PlainDate, asOfDate: string | PlainDate): boolean {
  return isPlainDateOnOrBefore(toPlainDate(retireDate), toPlainDate(asOfDate))
}

/** Extract the numeric year from an ISO YYYY-MM-DD string. Pure string op — no timezone risk. */
export function extractYear(dateStr: string | PlainDate): number {
  return typeof dateStr === 'string' ? parseInt(dateStr.slice(0, 4), 10) : dateStr.year
}

/** Return an ISO date string offset by N years with leap-day safety. */
export function addYearsISO(dateStr: string, years: number): string {
  return addPlainDateYears(toPlainDate(dateStr), years).toString()
}

/** True if the retire date falls within the given calendar year. */
export function retiresInYear(retireDate: string, year: number): boolean {
  return extractYear(retireDate) === year
}

/** True if retire date falls after fromDate and within 12 months of it. */
export function retiresWithinNextYear(retireDate: string, fromDate: string): boolean {
  return retiresWithinNextYearPlainDate(toPlainDate(retireDate), toPlainDate(fromDate))
}

export function addYearsDate(date: PlainDate, years: number): PlainDate {
  return addPlainDateYears(date, years)
}

export function diffDateYears(earlier: PlainDate, later: PlainDate): number {
  return diffPlainDateYears(earlier, later)
}

export function computeYOSDate(hireDate: PlainDate, asOfDate: PlainDate): number {
  return diffPlainDateYears(hireDate, asOfDate)
}

export function computeRetireDateValue(dob: PlainDate, retirementAge: number): PlainDate {
  const retire = dob.add({ years: retirementAge })
  return dob.month === 2 && dob.day === 29 && retire.month !== 2
    ? retire.subtract({ days: 1 })
    : retire
}

/** Current calendar year as a number. */
export function currentYear(asOfDate: PlainDate): number {
  return asOfDate.year
}

/** Handles leap day DOBs (Feb 29 → Feb 28 in non-leap retirement year). */
export function computeRetireDate(dob: string, retirementAge: number): string {
  const d = toPlainDate(dob)
  const retire = d.add({ years: retirementAge })
  return (d.month === 2 && d.day === 29 && retire.month !== 2)
    ? retire.subtract({ days: 1 }).toString()
    : retire.toString()
}
