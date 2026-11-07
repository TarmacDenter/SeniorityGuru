// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { analyzeRetirementHeatmap, analyzeRetirementYears } from './retirement-analysis'
import { Temporal } from '~/utils/temporal'

describe('analyzeRetirementYears', () => {
  it('groups retirement counts by year and preserves the Retirement Wave formula', () => {
    const entries = [
      makeDomainEntry({ retire_date: '2028-01-01' }), makeDomainEntry({ retire_date: '2029-01-01' }),
      ...Array.from({ length: 6 }, (_, index) => makeDomainEntry({ retire_date: `2030-0${(index % 6) + 1}-01` })),
    ]
    expect(analyzeRetirementYears(entries)).toEqual([
      { year: 2028, retirementCount: 1, isRetirementWave: false },
      { year: 2029, retirementCount: 1, isRetirementWave: false },
      { year: 2030, retirementCount: 6, isRetirementWave: true },
    ])
  })

  it('returns an empty result when no retirement date is available', () => {
    expect(analyzeRetirementYears([makeDomainEntry({ retire_date: undefined })])).toEqual([])
  })

  it('restricts waves with the supplied qualification filter', () => {
    const entries = [
      makeDomainEntry({ fleet: '737', retire_date: '2028-01-01' }),
      makeDomainEntry({ fleet: '320', retire_date: '2029-01-01' }),
    ]
    expect(analyzeRetirementYears(entries, entry => entry.fleet === '737')).toEqual([
      { year: 2028, retirementCount: 1, isRetirementWave: false },
    ])
  })
})

describe('analyzeRetirementHeatmap', () => {
  const asOfDate = Temporal.PlainDate.from('2026-06-15')
  const entries = [
    makeDomainEntry({ base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2026-09-01' }),
    makeDomainEntry({ base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2028-03-01' }),
    makeDomainEntry({ base: 'LAX', seat: 'CA', fleet: '320', retire_date: '2028-11-01' }),
    makeDomainEntry({ base: 'LAX', seat: 'CA', fleet: '320', retire_date: undefined }),
    // Retired by the As-of Date: in no row and no count.
    makeDomainEntry({ base: 'ATL', seat: 'CA', fleet: '737', retire_date: '2026-06-15' }),
  ]

  it('groups active pilots by one dimension with contiguous years from the As-of Date', () => {
    const heatmap = analyzeRetirementHeatmap(entries, { groupBy: ['base'], asOfDate })
    expect(heatmap.years).toEqual([2026, 2027, 2028])
    expect(heatmap.rows).toEqual([
      { group: { base: 'JFK' }, activePilotCount: 2, retirementCounts: [1, 0, 1], totalRetirementCount: 2 },
      { group: { base: 'LAX' }, activePilotCount: 2, retirementCounts: [0, 0, 1], totalRetirementCount: 1 },
    ])
    expect(heatmap.maxRetirementCount).toBe(1)
    expect(heatmap.undatedPilotCount).toBe(1)
  })

  it.each([
    [['seat'], [{ seat: 'CA' }, { seat: 'FO' }]],
    [['fleet', 'base'], [{ base: 'JFK', fleet: '737' }, { base: 'LAX', fleet: '320' }]],
    [['base', 'seat', 'fleet'], [{ base: 'JFK', seat: 'CA', fleet: '737' }, { base: 'JFK', seat: 'FO', fleet: '737' }, { base: 'LAX', seat: 'CA', fleet: '320' }]],
    [[], [{}]],
  ] as const)('groups by %j', (groupBy, groups) => {
    const heatmap = analyzeRetirementHeatmap(entries, { groupBy, asOfDate })
    expect(heatmap.rows.map(row => row.group)).toEqual(groups)
  })

  it('applies the Qualification Scope filter before grouping', () => {
    const heatmap = analyzeRetirementHeatmap(entries, { groupBy: ['base'], predicate: entry => entry.seat === 'CA', asOfDate })
    expect(heatmap.rows.map(row => [row.group.base, row.retirementCounts])).toEqual([
      ['JFK', [1, 0, 0]],
      ['LAX', [0, 0, 1]],
    ])
  })

  it('returns no years or rows for an empty list', () => {
    expect(analyzeRetirementHeatmap([], { groupBy: ['base'], asOfDate })).toEqual({ years: [], rows: [], maxRetirementCount: 0, undatedPilotCount: 0 })
  })
})
