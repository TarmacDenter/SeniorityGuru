// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { Temporal } from '~/utils/temporal'
import { createSeniorityAnalysis, isNoResult } from './seniority'

const asOfDate = Temporal.PlainDate.from('2026-06-15')
const through = Temporal.PlainDate.from('2030-06-15')

const entries = [
  makeEntry({ seniority_number: 10, employee_number: 'RETIRED', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2025-06-01' }),
  makeEntry({ seniority_number: 20, employee_number: 'ON-ASOF', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2026-06-15' }),
  makeEntry({ seniority_number: 30, employee_number: 'DAY-AFTER', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2026-06-16' }),
  makeEntry({ seniority_number: 40, employee_number: 'MID-WINDOW', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2028-01-01' }),
  makeEntry({ seniority_number: 50, employee_number: 'UNKNOWN', base: 'ATL', seat: 'FO', fleet: '320', retire_date: undefined }),
  makeEntry({ seniority_number: 60, employee_number: 'ATL-CA', base: 'ATL', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
]

const analysis = () => createSeniorityAnalysis({ entries, asOfDate })

describe('Anchor Pilot retired by the As-of Date', () => {
  it('returns a no-result Standing with a stated reason, never a hypothetical Rank', () => {
    const output = analysis().withAnchor('RETIRED').seniorityStanding()

    expect(output.domain).toEqual({ kind: 'no-result', reason: 'anchor-retired', label: 'Anchor Pilot retired' })
    expect(output.presentation).toEqual({ kind: 'no-result', reason: 'anchor-retired', label: 'Anchor Pilot retired' })
    expect(isNoResult(output.domain)).toBe(true)
  })

  it('returns no-result projections', () => {
    const anchored = analysis().withAnchor('RETIRED')

    expect(anchored.seniorityTrajectory({ through }).domain).toMatchObject({ kind: 'no-result', reason: 'anchor-retired' })
    expect(anchored.percentileCrossing({ through, targetPercentile: 50 }).domain).toMatchObject({ kind: 'no-result', reason: 'anchor-retired' })
    expect(anchored.qualificationPositions({ through }).domain).toMatchObject({ kind: 'no-result', reason: 'anchor-retired' })
    expect(anchored.seniorityTrajectoryComparison({ through }).domain).toMatchObject({ kind: 'no-result', reason: 'anchor-retired' })
  })

  it('treats retirement exactly on the As-of Date as retired', () => {
    expect(analysis().withAnchor('ON-ASOF').seniorityStanding().domain).toMatchObject({ reason: 'anchor-retired' })
  })

  it('treats retirement the day after the As-of Date as active', () => {
    const output = analysis().withAnchor('DAY-AFTER').seniorityStanding()
    expect(isNoResult(output.domain)).toBe(false)
  })

  it('treats an unknown retirement date as active', () => {
    const anchored = analysis().withAnchor('UNKNOWN')
    expect(isNoResult(anchored.seniorityStanding().domain)).toBe(false)
    const trajectory = anchored.seniorityTrajectory({ through }).domain
    expect(isNoResult(trajectory)).toBe(false)
    if (!isNoResult(trajectory)) {
      expect(trajectory.points).toHaveLength(5)
      expect(trajectory.endedBy).toBeUndefined()
    }
  })
})

describe('Anchor Pilot retires during the projection window', () => {
  it('stops trajectory samples before the retirement date and carries the reason', () => {
    const output = analysis().withAnchor('MID-WINDOW').seniorityTrajectory({ through })
    const domain = output.domain
    if (isNoResult(domain)) throw new Error('expected a trajectory')

    expect(domain.points.map(point => point.date.toString())).toEqual(['2026-06-15', '2027-06-15'])
    expect(domain.endedBy).toEqual({ kind: 'no-result', reason: 'anchor-retired', label: 'Anchor Pilot retired' })
    expect(domain.changes).toHaveLength(1)

    const presented = output.presentation
    if (isNoResult(presented)) throw new Error('expected a presented trajectory')
    expect(presented.chartData.labels).toEqual(['2026-06-15', '2027-06-15'])
    expect(presented.endedByLabel).toBe('Projection ends at your retirement')
  })

  it('does not report an end reason when the projection finishes before retirement', () => {
    const domain = analysis().withAnchor('MID-WINDOW').seniorityTrajectory({ through: Temporal.PlainDate.from('2027-06-15') }).domain
    if (isNoResult(domain)) throw new Error('expected a trajectory')
    expect(domain.endedBy).toBeUndefined()
    expect(domain.points).toHaveLength(2)
  })

  it('truncates the trajectory comparison and percentile crossing consistently', () => {
    const comparison = analysis().withAnchor('MID-WINDOW').seniorityTrajectoryComparison({ through }).domain
    if (isNoResult(comparison)) throw new Error('expected a comparison')
    expect(comparison.points).toHaveLength(2)
    expect(comparison.endedBy?.reason).toBe('anchor-retired')
  })
})

describe('Anchor Pilot outside the Qualification Scope', () => {
  const scenario = { qualificationScope: { base: 'ATL' } }

  it('still returns results, marked as a Hypothetical Placement, instead of a no-result', () => {
    const anchored = analysis().withAnchor('MID-WINDOW')

    expect(isNoResult(anchored.seniorityStanding({ scenario }).domain)).toBe(false)
    expect(isNoResult(anchored.seniorityTrajectory({ through, scenario }).domain)).toBe(false)
    expect(isNoResult(anchored.percentileCrossing({ through, scenario, targetPercentile: 50 }).domain)).toBe(false)
    expect(isNoResult(anchored.qualificationPositions({ through }).domain)).toBe(false)
    expect(isNoResult(anchored.seniorityTrajectoryComparison({ through, comparisonScenario: scenario }).domain)).toBe(false)
  })

  it('reports a retired Anchor Pilot as retired even when outside the scope', () => {
    const expected = { kind: 'no-result', reason: 'anchor-retired', label: 'Anchor Pilot retired' }
    expect(analysis().withAnchor('RETIRED').seniorityStanding({ scenario }).domain).toEqual(expected)
  })
})
