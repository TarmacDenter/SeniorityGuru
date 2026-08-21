// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { QualDemographicScale } from './seniority-engine/types'
import { sortQualificationScales } from './qualification-order'

function scale(overrides: Partial<QualDemographicScale>): QualDemographicScale {
  return {
    fleet: '737',
    seat: 'FO',
    base: 'JFK',
    activeCount: 1,
    plugPercentile: 50,
    plugSenNum: 100,
    p25: 25,
    median: 50,
    p75: 75,
    max: 100,
    density: [],
    userPercentile: 50,
    currentUserPercentile: 50,
    isHoldable: true,
    ...overrides,
  }
}

describe('sortQualificationScales', () => {
  it('orders captain scales before first-officer scales, then fleet and plug position', () => {
    const sorted = sortQualificationScales([
      scale({ fleet: '737', seat: 'FO', plugPercentile: 40 }),
      scale({ fleet: '320', seat: 'CA', plugPercentile: 60 }),
      scale({ fleet: '737', seat: 'CA', plugPercentile: 70 }),
      scale({ fleet: '737', seat: 'CA', plugPercentile: 30 }),
    ])

    expect(sorted.map(({ fleet, seat, plugPercentile }) => `${fleet} ${seat} ${plugPercentile}`)).toEqual([
      '320 CA 60',
      '737 CA 30',
      '737 CA 70',
      '737 FO 40',
    ])
  })

  it('does not mutate the input scales', () => {
    const scales = [
      scale({ fleet: '737', seat: 'FO' }),
      scale({ fleet: '320', seat: 'CA' }),
    ]

    sortQualificationScales(scales)

    expect(scales.map(({ fleet, seat }) => `${fleet} ${seat}`)).toEqual(['737 FO', '320 CA'])
  })
})
