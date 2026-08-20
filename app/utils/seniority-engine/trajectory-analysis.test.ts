// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { findThresholdYear } from './trajectory-analysis'

describe('findThresholdYear', () => {
  it('returns the first threshold crossing', () => {
    expect(findThresholdYear([{ date: '2026-01-01', rank: 3, percentile: 40 }, { date: '2027-01-01', rank: 2, percentile: 51 }], 50)).toEqual({ year: '2027' })
  })
})
