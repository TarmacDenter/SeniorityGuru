// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { ISO_DATE_REGEX, EXCEL_EPOCH_MS } from './constants'

describe('ISO_DATE_REGEX', () => {
  it('matches YYYY-MM-DD', () => {
    expect(ISO_DATE_REGEX.test('2026-01-15')).toBe(true)
  })
  it('rejects non-date strings', () => {
    expect(ISO_DATE_REGEX.test('01/15/2026')).toBe(false)
  })
})

describe('EXCEL_EPOCH_MS', () => {
  it('is Dec 30, 1899 UTC', () => {
    const d = new Date(EXCEL_EPOCH_MS)
    expect(d.getUTCFullYear()).toBe(1899)
    expect(d.getUTCMonth()).toBe(11) // December
    expect(d.getUTCDate()).toBe(30)
  })
})
