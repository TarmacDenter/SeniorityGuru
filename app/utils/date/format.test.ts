// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { formatDate, formatMonthYear, formatYear, todayISO } from '.'

describe('formatDate', () => {
  it('formats local date', () => {
    const d = new Date(2026, 0, 15)
    expect(formatDate(d)).toBe('2026-01-15')
  })
  it('formats UTC date', () => {
    const d = new Date(Date.UTC(2026, 0, 15))
    expect(formatDate(d, true)).toBe('2026-01-15')
  })
})

describe('formatMonthYear', () => {
  it('formats "2026-01-15" as "Jan 2026"', () => {
    expect(formatMonthYear('2026-01-15')).toBe('Jan 2026')
  })
  it('formats "2025-12-01" as "Dec 2025"', () => {
    expect(formatMonthYear('2025-12-01')).toBe('Dec 2025')
  })
  it('formats "1985-09-27" as "Sep 1985"', () => {
    expect(formatMonthYear('1985-09-27')).toBe('Sep 1985')
  })
})

describe('formatYear', () => {
  it('extracts year from ISO date', () => {
    expect(formatYear('2026-01-15')).toBe('2026')
  })
  it('extracts year from another date', () => {
    expect(formatYear('1985-09-27')).toBe('1985')
  })
})

describe('todayISO', () => {
  it('returns a valid YYYY-MM-DD string', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
