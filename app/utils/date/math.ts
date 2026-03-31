import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

/** Fractional years between two dates. Accepts ISO strings or Date objects. */
export function diffYears(earlier: string | Date, later: string | Date): number {
  return dayjs.utc(later).diff(dayjs.utc(earlier), 'year', true)
}

/** Back-calculate approximate current age from retirement date and mandatory retirement age. */
export function deriveAge(retireDate: string, mandatoryAge: number): number {
  const birthDate = dayjs.utc(retireDate).subtract(mandatoryAge, 'year')
  return Math.floor(dayjs.utc().diff(birthDate, 'year', true))
}

/** Years of service from hire date to now. */
export function computeYOS(hireDateStr: string): number {
  return dayjs.utc().diff(dayjs.utc(hireDateStr), 'year', true)
}

/** True if retireDate is on or before asOfDate. Both are YYYY-MM-DD strings. */
export function isRetiredBy(retireDate: string, asOfDate: string): boolean {
  return !dayjs.utc(retireDate).isAfter(dayjs.utc(asOfDate), 'day')
}

/** Extract the numeric year from an ISO YYYY-MM-DD string. Pure string op — no timezone risk. */
export function extractYear(dateStr: string): number {
  return parseInt(dateStr.slice(0, 4), 10)
}

/** Return an ISO date string offset by N years. Uses dayjs for leap-day safety. */
export function addYearsISO(dateStr: string, years: number): string {
  return dayjs.utc(dateStr).add(years, 'year').format('YYYY-MM-DD')
}

/** True if the retire date falls within the given calendar year. */
export function retiresInYear(retireDate: string, year: number): boolean {
  return extractYear(retireDate) === year
}

/** True if retire date falls after fromDate and within 12 months of it. */
export function retiresWithinNextYear(retireDate: string, fromDate: string): boolean {
  const retire = dayjs.utc(retireDate)
  const from = dayjs.utc(fromDate)
  return retire.isAfter(from, 'day') && !retire.isAfter(from.add(1, 'year'), 'day')
}

/** Current calendar year as a number. */
export function currentYear(): number {
  return dayjs().year()
}

/** Handles leap day DOBs (Feb 29 → Feb 28 in non-leap retirement year). */
export function computeRetireDate(dob: string, retirementAge: number): string {
  const d = dayjs.utc(dob)
  const dobMonth = d.month()
  const retire = d.add(retirementAge, 'year')
  if (dobMonth === 1 && retire.month() !== 1) {
    return retire.subtract(1, 'day').format('YYYY-MM-DD')
  }
  return retire.format('YYYY-MM-DD')
}
