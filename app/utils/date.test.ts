// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { formatDate, parseExcelSerial, parseSlashDate, normalizeDate, computeRetireDate, isValidCalendarDate } from './date'

describe('formatDate', () => {
  it('formats local date', () => {
    const d = new Date(2026, 0, 15) // Jan 15 2026 local
    expect(formatDate(d)).toBe('2026-01-15')
  })

  it('formats UTC date', () => {
    const d = new Date(Date.UTC(2026, 0, 15))
    expect(formatDate(d, true)).toBe('2026-01-15')
  })
})

describe('isValidCalendarDate', () => {
  it('accepts a valid date', () => {
    expect(isValidCalendarDate(2010, 1, 15)).toBe(true)
  })

  it('rejects invalid month (13)', () => {
    expect(isValidCalendarDate(2010, 13, 15)).toBe(false)
  })

  it('rejects month 0', () => {
    expect(isValidCalendarDate(2010, 0, 15)).toBe(false)
  })

  it('rejects invalid day (32)', () => {
    expect(isValidCalendarDate(2010, 1, 32)).toBe(false)
  })

  it('accepts Feb 29 on leap year', () => {
    expect(isValidCalendarDate(2024, 2, 29)).toBe(true)
  })

  it('rejects Feb 29 on non-leap year', () => {
    expect(isValidCalendarDate(2023, 2, 29)).toBe(false)
  })

  it('rejects 3-digit year', () => {
    expect(isValidCalendarDate(202, 1, 15)).toBe(false)
  })

  it('rejects year > 2099', () => {
    expect(isValidCalendarDate(2100, 1, 1)).toBe(false)
  })

  it('accepts boundary year 1900', () => {
    expect(isValidCalendarDate(1900, 1, 1)).toBe(true)
  })

  it('accepts boundary year 2099', () => {
    expect(isValidCalendarDate(2099, 12, 31)).toBe(true)
  })
})

describe('parseExcelSerial', () => {
  it('converts 40193 to 2010-01-15', () => {
    expect(parseExcelSerial(40193)).toBe('2010-01-15')
  })

  it('converts 1 to 1899-12-31', () => {
    expect(parseExcelSerial(1)).toBe('1899-12-31')
  })
})

describe('parseSlashDate', () => {
  it('parses MM/DD/YYYY', () => {
    expect(parseSlashDate('01/15/2010')).toBe('2010-01-15')
  })

  it('parses M/D/YYYY', () => {
    expect(parseSlashDate('1/5/2010')).toBe('2010-01-05')
  })

  it('parses MM-DD-YYYY', () => {
    expect(parseSlashDate('06-15-1970')).toBe('1970-06-15')
  })

  it('parses MM.DD.YYYY (dot separator)', () => {
    expect(parseSlashDate('01.15.2010')).toBe('2010-01-15')
  })

  it('parses M.D.YYYY (dot, single digits)', () => {
    expect(parseSlashDate('1.5.2010')).toBe('2010-01-05')
  })

  it('handles 2-digit year <= 50 as 2000s', () => {
    expect(parseSlashDate('3/7/10')).toBe('2010-03-07')
  })

  it('handles 2-digit year > 50 as 1900s', () => {
    expect(parseSlashDate('3/7/70')).toBe('1970-03-07')
  })

  it('rejects invalid month (13)', () => {
    expect(parseSlashDate('13/15/2010')).toBeNull()
  })

  it('rejects invalid day (32)', () => {
    expect(parseSlashDate('01/32/2010')).toBeNull()
  })

  it('rejects Feb 29 on non-leap year', () => {
    expect(parseSlashDate('02/29/2023')).toBeNull()
  })

  it('accepts Feb 29 on leap year', () => {
    expect(parseSlashDate('02/29/2024')).toBe('2024-02-29')
  })

  it('rejects 3-digit year', () => {
    expect(parseSlashDate('01/15/202')).toBeNull()
  })

  it('returns null for non-date', () => {
    expect(parseSlashDate('not-a-date')).toBeNull()
  })
})

describe('normalizeDate', () => {
  // Existing formats
  it('passes through YYYY-MM-DD unchanged', () => {
    expect(normalizeDate('2010-01-15')).toBe('2010-01-15')
  })
  it('converts MM/DD/YYYY', () => {
    expect(normalizeDate('01/15/2010')).toBe('2010-01-15')
  })
  it('converts Excel serial number', () => {
    expect(normalizeDate('40193')).toBe('2010-01-15')
  })
  it('returns original for unparseable input', () => {
    expect(normalizeDate('not-a-date')).toBe('not-a-date')
  })
  it('handles empty string', () => {
    expect(normalizeDate('')).toBe('')
  })
  it('trims whitespace', () => {
    expect(normalizeDate('  01/15/2010  ')).toBe('2010-01-15')
  })

  // ISO datetime with time component
  it('strips time from ISO datetime', () => {
    expect(normalizeDate('2010-01-15T00:00:00')).toBe('2010-01-15')
  })
  it('strips time from ISO datetime with Z', () => {
    expect(normalizeDate('2010-01-15T00:00:00Z')).toBe('2010-01-15')
  })
  it('strips time from ISO datetime with offset', () => {
    expect(normalizeDate('2010-01-15T00:00:00+05:00')).toBe('2010-01-15')
  })
  it('strips time from ISO datetime with space separator', () => {
    expect(normalizeDate('2010-01-15 12:30:00')).toBe('2010-01-15')
  })

  // YYYY/MM/DD and YYYY.MM.DD
  it('converts YYYY/MM/DD', () => {
    expect(normalizeDate('2010/01/15')).toBe('2010-01-15')
  })
  it('converts YYYY/M/D (single-digit month/day)', () => {
    expect(normalizeDate('2010/1/5')).toBe('2010-01-05')
  })
  it('converts YYYY.MM.DD', () => {
    expect(normalizeDate('2010.01.15')).toBe('2010-01-15')
  })

  // Dot-separated MM.DD.YYYY
  it('converts dot-separated MM.DD.YYYY', () => {
    expect(normalizeDate('06.15.1970')).toBe('1970-06-15')
  })

  // Named month formats
  it('converts "Jan 15, 2010"', () => {
    expect(normalizeDate('Jan 15, 2010')).toBe('2010-01-15')
  })
  it('converts "15 Jan 2010"', () => {
    expect(normalizeDate('15 Jan 2010')).toBe('2010-01-15')
  })
  it('converts "January 15, 2010"', () => {
    expect(normalizeDate('January 15, 2010')).toBe('2010-01-15')
  })

  // Calendar validation
  it('returns invalid ISO date as-is for downstream error', () => {
    expect(normalizeDate('2010-13-32')).toBe('2010-13-32')
  })
  it('returns invalid slash date as-is', () => {
    expect(normalizeDate('13/32/2010')).toBe('13/32/2010')
  })
})

describe('computeRetireDate', () => {
  it('adds retirement age to DOB', () => {
    expect(computeRetireDate('1970-06-15', 65)).toBe('2035-06-15')
  })
  it('handles leap day DOB', () => {
    expect(computeRetireDate('1960-02-29', 65)).toBe('2025-02-28')
  })
})
