// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { isValidCalendarDate } from './validate'

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
