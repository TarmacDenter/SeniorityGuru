// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parseExcelSerial, parseSlashDate, normalizeDate, detectDateFormat, detectFutureDateFormat, normalizeDateFuture } from './parse'

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
  it('parses MM/DD/YY with zero-padded components', () => {
    expect(parseSlashDate('03/26/26')).toBe('2026-03-26')
  })
  it('handles 2-digit year boundary at 50 (2000s)', () => {
    expect(parseSlashDate('01/01/50')).toBe('2050-01-01')
  })
  it('handles 2-digit year boundary at 51 (1900s)', () => {
    expect(parseSlashDate('01/01/51')).toBe('1951-01-01')
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
  it('converts YYYY/MM/DD', () => {
    expect(normalizeDate('2010/01/15')).toBe('2010-01-15')
  })
  it('converts YYYY/M/D (single-digit month/day)', () => {
    expect(normalizeDate('2010/1/5')).toBe('2010-01-05')
  })
  it('converts YYYY.MM.DD', () => {
    expect(normalizeDate('2010.01.15')).toBe('2010-01-15')
  })
  it('converts dot-separated MM.DD.YYYY', () => {
    expect(normalizeDate('06.15.1970')).toBe('1970-06-15')
  })
  it('converts "Jan 15, 2010"', () => {
    expect(normalizeDate('Jan 15, 2010')).toBe('2010-01-15')
  })
  it('converts "15 Jan 2010"', () => {
    expect(normalizeDate('15 Jan 2010')).toBe('2010-01-15')
  })
  it('converts "January 15, 2010"', () => {
    expect(normalizeDate('January 15, 2010')).toBe('2010-01-15')
  })
  it('converts "27Sep1985" (compact, no spaces)', () => {
    expect(normalizeDate('27Sep1985')).toBe('1985-09-27')
  })
  it('converts "03May2026" (compact, no spaces)', () => {
    expect(normalizeDate('03May2026')).toBe('2026-05-03')
  })
  it('converts "01Mar2026" (compact, no spaces)', () => {
    expect(normalizeDate('01Mar2026')).toBe('2026-03-01')
  })
  it('converts MM/DD/YY with year <= 50 to 2000s', () => {
    expect(normalizeDate('03/26/26')).toBe('2026-03-26')
  })
  it('converts MM/DD/YY with year > 50 to 1900s', () => {
    expect(normalizeDate('06/15/70')).toBe('1970-06-15')
  })
  it('converts M/D/YY (single-digit month/day)', () => {
    expect(normalizeDate('1/5/10')).toBe('2010-01-05')
  })
  it('converts MM-DD-YY (dash separator)', () => {
    expect(normalizeDate('03-26-26')).toBe('2026-03-26')
  })
  it('converts MM.DD.YY (dot separator)', () => {
    expect(normalizeDate('03.26.26')).toBe('2026-03-26')
  })
  it('handles MM/DD/YY century pivot boundary at 50', () => {
    expect(normalizeDate('01/01/50')).toBe('2050-01-01')
  })
  it('handles MM/DD/YY century pivot boundary at 51', () => {
    expect(normalizeDate('01/01/51')).toBe('1951-01-01')
  })
  it('returns invalid ISO date as-is for downstream error', () => {
    expect(normalizeDate('2010-13-32')).toBe('2010-13-32')
  })
  it('returns invalid slash date as-is', () => {
    expect(normalizeDate('13/32/2010')).toBe('13/32/2010')
  })
})

describe('detectDateFormat', () => {
  it('detects ISO format', () => {
    const parser = detectDateFormat(['2010-01-15', '2020-06-30', '1985-09-27'])
    expect(parser).not.toBeNull()
    expect(parser!.name).toBe('ISO')
  })
  it('detects US slash format', () => {
    const parser = detectDateFormat(['01/15/2010', '06/30/2020', '09/27/1985'])
    expect(parser).not.toBeNull()
    expect(parser!.name).toBe('US slash')
  })
  it('detects compact DDMonYYYY format', () => {
    const parser = detectDateFormat(['27Sep1985', '15Jan2010', '03May2026'])
    expect(parser).not.toBeNull()
    expect(parser!.name).toBe('compact DDMonYYYY')
  })
  it('returns null for mixed formats', () => {
    const parser = detectDateFormat(['2010-01-15', '01/15/2010', '27Sep1985'])
    expect(parser).toBeNull()
  })
  it('detects MM/DD/YY (2-digit year) as US slash format', () => {
    const parser = detectDateFormat(['01/15/10', '06/30/20', '09/27/85'])
    expect(parser).not.toBeNull()
    expect(parser!.name).toBe('US slash')
    expect(parser!.parse('01/15/10')).toBe('2010-01-15')
    expect(parser!.parse('09/27/85')).toBe('1985-09-27')
  })
  it('returns null for empty array', () => {
    expect(detectDateFormat([])).toBeNull()
  })
  it('returns the matched parser that works for all samples', () => {
    const parser = detectDateFormat(['1/5/2010', '12/31/2020'])
    expect(parser).not.toBeNull()
    expect(parser!.parse('1/5/2010')).toBe('2010-01-05')
    expect(parser!.parse('12/31/2020')).toBe('2020-12-31')
  })
})

describe('detectFutureDateFormat', () => {
  it('detects M/D/YY with years > 50 as US slash (future) format', () => {
    const parser = detectFutureDateFormat(['6/13/26', '9/6/55', '3/15/62'])
    expect(parser).not.toBeNull()
    expect(parser!.name).toBe('US slash (future)')
  })

  it('maps 2-digit years > 50 to 20xx', () => {
    const parser = detectFutureDateFormat(['6/13/26', '9/6/55', '3/15/62'])
    expect(parser!.parse('9/6/55')).toBe('2055-09-06')
    expect(parser!.parse('3/15/62')).toBe('2062-03-15')
  })

  it('maps 2-digit years <= 50 to 20xx', () => {
    const parser = detectFutureDateFormat(['6/13/26', '3/15/40'])
    expect(parser!.parse('6/13/26')).toBe('2026-06-13')
    expect(parser!.parse('3/15/40')).toBe('2040-03-15')
  })

  it('handles 4-digit years unchanged', () => {
    const parser = detectFutureDateFormat(['6/13/2026', '9/6/2055'])
    expect(parser).not.toBeNull()
    expect(parser!.parse('9/6/2055')).toBe('2055-09-06')
  })

  it('returns null for empty array', () => {
    expect(detectFutureDateFormat([])).toBeNull()
  })
})

describe('normalizeDateFuture', () => {
  it('maps 2-digit year > 50 to 20xx', () => {
    expect(normalizeDateFuture('9/6/55')).toBe('2055-09-06')
    expect(normalizeDateFuture('3/15/62')).toBe('2062-03-15')
  })

  it('maps 2-digit year <= 50 to 20xx', () => {
    expect(normalizeDateFuture('6/13/26')).toBe('2026-06-13')
    expect(normalizeDateFuture('3/15/40')).toBe('2040-03-15')
  })

  it('passes through ISO dates unchanged', () => {
    expect(normalizeDateFuture('2055-09-06')).toBe('2055-09-06')
  })

  it('handles M/D/YYYY (4-digit year) unchanged', () => {
    expect(normalizeDateFuture('6/13/2026')).toBe('2026-06-13')
  })

  it('returns unparseable input as-is for downstream validation', () => {
    expect(normalizeDateFuture('not-a-date')).toBe('not-a-date')
  })
})
