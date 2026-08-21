// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { findThresholdYear } from './trajectory-analysis'

describe('findThresholdYear', () => {
  it('returns the first threshold crossing', () => {
    expect(findThresholdYear([{ date: '2026-01-01', rank: 3, percentile: 40 }, { date: '2027-01-01', rank: 2, percentile: 51 }], 50)).toEqual({ year: '2027' })
  })

  it('returns null when the trajectory never reaches the threshold', () => {
    expect(findThresholdYear([
      { date: '2026-01-01', rank: 3, percentile: 30 },
      { date: '2027-01-01', rank: 2, percentile: 45 },
    ], 50)).toBeNull()
  })

  it('returns the year without obsolete scenario alternatives', () => {
    const result = findThresholdYear([{ date: '2027-01-01', rank: 2, percentile: 60 }], 50)
    expect(result).toEqual({ year: '2027' })
    expect(result).not.toHaveProperty('optimistic')
    expect(result).not.toHaveProperty('pessimistic')
  })
})
