// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parsePlainDate } from '~/utils/temporal'
import { findPercentileCrossing } from './trajectory-analysis'

describe('findPercentileCrossing', () => {
  it('returns the first numeric crossing year', () => {
    expect(findPercentileCrossing([
      { date: parsePlainDate('2026-01-01'), rank: 3, percentile: 40 },
      { date: parsePlainDate('2027-01-01'), rank: 2, percentile: 51 },
    ], 50)).toEqual({ crossingYear: 2027 })
  })

  it('returns null when the trajectory never reaches the percentile', () => {
    expect(findPercentileCrossing([
      { date: parsePlainDate('2026-01-01'), rank: 3, percentile: 30 },
      { date: parsePlainDate('2027-01-01'), rank: 2, percentile: 45 },
    ], 50)).toBeNull()
  })
})
