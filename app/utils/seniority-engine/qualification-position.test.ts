// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { GrowthConfig } from './types'
import { makeDomainEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'
import { applyProjectionToSnapshots, computeQualSnapshots } from './qualification-position'

describe('qualification position', () => {
  it('keeps projected holdability state in qualification scales', () => {
    const asOfDate = parsePlainDate('2026-01-01')
    const entries = [makeDomainEntry({ seniority_number: 1 }), makeDomainEntry({ seniority_number: 2 })]
    const scales = applyProjectionToSnapshots(computeQualSnapshots(entries, asOfDate), entries, 1, asOfDate, undefined, asOfDate)
    expect(scales[0]).toMatchObject({ plugSenNum: 2, isHoldable: true })
  })

  it('returns no snapshots when every entry is retired at the reference date', () => {
    const asOfDate = parsePlainDate('2026-01-01')
    const entries = [makeDomainEntry({ retire_date: '2025-01-01' })]
    expect(computeQualSnapshots(entries, asOfDate)).toEqual([])
  })

  it('keeps the current percentile fixed while growth changes the projection', () => {
    const asOfDate = parsePlainDate('2026-01-01')
    const entries = Array.from({ length: 20 }, (_, index) => makeDomainEntry({
      seniority_number: index + 1,
      employee_number: `EMP${String(index + 1).padStart(4, '0')}`,
      retire_date: `${2030 + index}-01-01`,
    }))
    const snapshots = computeQualSnapshots(entries, asOfDate)
    const growth: GrowthConfig = { enabled: true, annualRate: 0.05 }
    const projectionDate = parsePlainDate('2035-01-01')
    const withoutGrowth = applyProjectionToSnapshots(snapshots, entries, 10, projectionDate, undefined, asOfDate)
    const withGrowth = applyProjectionToSnapshots(snapshots, entries, 10, projectionDate, growth, asOfDate)
    expect(withGrowth[0]!.currentUserPercentile).toBe(withoutGrowth[0]!.currentUserPercentile)
    expect(withGrowth[0]!.userPercentile).toBeGreaterThan(withoutGrowth[0]!.userPercentile)
  })
})
