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

  describe('with a retired pilot in the publication', () => {
    const qualA = { base: 'AAA', seat: 'CA', fleet: '737' }
    const qualB = { base: 'BBB', seat: 'CA', fleet: '737' }
    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E1', retire_date: '2025-01-01', ...qualA }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'E2', retire_date: '2028-01-01', ...qualB }),
      makeDomainEntry({ seniority_number: 3, employee_number: 'E3', ...qualB }),
      makeDomainEntry({ seniority_number: 4, employee_number: 'E4', ...qualA }),
      makeDomainEntry({ seniority_number: 5, employee_number: 'E5', ...qualA }),
    ]
    const find = (positions: ReturnType<typeof analyzeQualificationPositions>, base: string) =>
      positions.find(position => position.distribution.qualification.base === base)!

    it('measures thresholds against Roster Size while counting only active incumbents', () => {
      const positions = analyzeQualificationPositions(entries, 4, asOfDate, asOfDate)
      const a = find(positions, 'AAA').distribution
      const b = find(positions, 'BBB').distribution

      expect(a.activePilotCount).toBe(2)
      expect(a.rosterSize).toBe(5)
      expect(a.thresholdSeniorityNumber).toBe(5)
      expect(a.thresholdPercentile).toBe(40)
      expect(a.maximumPercentile).toBe(60)
      expect(b.rosterSize).toBe(5)
      expect(b.thresholdPercentile).toBe(80)
      expect(b.maximumPercentile).toBe(100)
      expect(find(positions, 'AAA').currentPercentile).toBe(60)
    })

    it('keeps thresholds fixed at the As-of Date while the Anchor Pilot projection advances', () => {
      const asOf = find(analyzeQualificationPositions(entries, 4, asOfDate, asOfDate), 'BBB')
      const later = find(analyzeQualificationPositions(entries, 4, asOfDate, parsePlainDate('2030-01-01')), 'BBB')

      expect(later.distribution.thresholdPercentile).toBe(asOf.distribution.thresholdPercentile)
      expect(asOf.projectedPercentile).toBe(60)
      expect(asOf.modeledHoldable).toBe(false)
      expect(later.projectedPercentile).toBe(80)
      expect(later.modeledHoldable).toBe(true)
    })
  })
})
