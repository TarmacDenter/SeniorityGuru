// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PresentedQualificationPosition } from './seniority-analysis/presentation'
import { sortQualificationPositions } from './qualification-order'

function position(overrides: Partial<PresentedQualificationPosition>): PresentedQualificationPosition {
  return {
    qualification: { fleet: '737', seat: 'FO', base: 'JFK' },
    activePilotCount: 1,
    thresholdPercentile: 50,
    thresholdSeniorityNumber: 100,
    percentile25: 25,
    medianPercentile: 50,
    percentile75: 75,
    maximumPercentile: 100,
    percentileDensity: [],
    projectedPercentile: 50,
    currentPercentile: 50,
    modeledHoldable: true,
    ...overrides,
  }
}

describe('sortQualificationPositions', () => {
  it('orders captains before first officers, then fleet and threshold percentile', () => {
    const sorted = sortQualificationPositions([
      position({ qualification: { fleet: '737', seat: 'FO', base: 'JFK' }, thresholdPercentile: 40 }),
      position({ qualification: { fleet: '320', seat: 'CA', base: 'JFK' }, thresholdPercentile: 60 }),
      position({ qualification: { fleet: '737', seat: 'CA', base: 'JFK' }, thresholdPercentile: 70 }),
      position({ qualification: { fleet: '737', seat: 'CA', base: 'JFK' }, thresholdPercentile: 30 }),
    ])

    expect(sorted.map(({ qualification, thresholdPercentile }) => `${qualification.fleet} ${qualification.seat} ${thresholdPercentile}`)).toEqual([
      '320 CA 60',
      '737 CA 30',
      '737 CA 70',
      '737 FO 40',
    ])
  })

  it('does not mutate the input scales', () => {
    const positions = [
      position({ qualification: { fleet: '737', seat: 'FO', base: 'JFK' } }),
      position({ qualification: { fleet: '320', seat: 'CA', base: 'JFK' } }),
    ]

    sortQualificationPositions(positions)

    expect(positions.map(({ qualification }) => `${qualification.fleet} ${qualification.seat}`)).toEqual(['737 FO', '320 CA'])
  })
})
