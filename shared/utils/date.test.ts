// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { formatDate, parseExcelSerial, parseSlashDate, normalizeDate, computeRetireDate } from './date'

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

  it('handles 2-digit year <= 50 as 2000s', () => {
    expect(parseSlashDate('3/7/10')).toBe('2010-03-07')
  })

  it('handles 2-digit year > 50 as 1900s', () => {
    expect(parseSlashDate('3/7/70')).toBe('1970-03-07')
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
})

describe('computeRetireDate', () => {
  it('adds retirement age to DOB', () => {
    expect(computeRetireDate('1970-06-15', 65)).toBe('2035-06-15')
  })
  it('handles leap day DOB', () => {
    expect(computeRetireDate('1960-02-29', 65)).toBe('2025-02-28')
  })
})
