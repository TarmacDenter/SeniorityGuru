// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'
import { analyzeQualificationPositions } from './qualification-position'

const asOfDate = parsePlainDate('2026-01-01')

describe('Qualification Position analysis', () => {
  it('returns a distribution, current and projected percentiles, and modeled Holdable state', () => {
    const positions = analyzeQualificationPositions([
      makeDomainEntry({ seniority_number: 100 }),
      makeDomainEntry({ seniority_number: 125 }),
    ], 100, asOfDate, asOfDate)

    expect(positions[0]).toEqual(expect.objectContaining({
      distribution: expect.objectContaining({
        qualification: expect.objectContaining({ base: expect.any(String), seat: expect.any(String), fleet: expect.any(String) }),
        activePilotCount: 2,
        thresholdPercentile: 50,
        thresholdSeniorityNumber: 125,
        percentile25: 50,
        medianPercentile: 50,
        percentile75: 50,
        maximumPercentile: 100,
        percentileDensity: expect.any(Array),
      }),
      currentPercentile: 100,
      projectedPercentile: 100,
      modeledHoldable: true,
    }))
    expect(positions[0]?.distribution.percentileDensity[10]).toEqual({
      minimumPercentile: 50,
      maximumPercentile: 55,
      pilotCount: 1,
    })
  })

  it('returns no positions when every entry is retired at the As-of Date', () => {
    expect(analyzeQualificationPositions([
      makeDomainEntry({ retire_date: '2025-01-01' }),
    ], 1, asOfDate, asOfDate)).toEqual([])
  })

  it('keeps the current percentile fixed while growth changes the projection', () => {
    const entries = Array.from({ length: 20 }, (_, index) => makeDomainEntry({
      seniority_number: index + 1,
      employee_number: `EMP${String(index + 1).padStart(4, '0')}`,
      retire_date: `${2030 + index}-01-01`,
    }))
    const through = parsePlainDate('2035-01-01')
    const withoutGrowth = analyzeQualificationPositions(entries, 10, asOfDate, through)
    const withGrowth = analyzeQualificationPositions(entries, 10, asOfDate, through, {
      enabled: true,
      annualGrowthRate: 0.05,
    })

    expect(withGrowth[0]!.currentPercentile).toBe(withoutGrowth[0]!.currentPercentile)
    expect(withGrowth[0]!.projectedPercentile).toBeGreaterThan(withoutGrowth[0]!.projectedPercentile)
  })
})
