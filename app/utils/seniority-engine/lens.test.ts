// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { Temporal } from '~/utils/temporal'
import { AnchorNotFoundError, createLens } from './lens'
import { createScenario } from './scenario'
import { createSnapshot } from './snapshot'
import type { AnchoredSeniorityLens, SeniorityLens } from './types'

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00'))
})
afterAll(() => vi.useRealTimers())

const entries = [
  makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2000-01-01', retire_date: '2025-06-01' }),
  makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2005-01-01', retire_date: '2026-12-01' }),
  makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'ATL', seat: 'FO', fleet: '320', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
  makeEntry({ seniority_number: 4, employee_number: 'E4', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2015-01-01', retire_date: '2045-01-01' }),
  makeEntry({ seniority_number: 5, employee_number: 'E5', base: 'ATL', seat: 'FO', fleet: '320', hire_date: '2020-01-01', retire_date: '2050-01-01' }),
]
const snapshot = createSnapshot(entries)
const asOfDate = Temporal.PlainDate.from('2026-06-15')
const projectionEndDate = Temporal.PlainDate.from('2060-06-15')
const makeLens = () => createLens(snapshot, { asOfDate })

function assertBaseLensCapabilities(lens: SeniorityLens) {
  // @ts-expect-error pilot-relative methods require AnchoredSeniorityLens.
  lens.standing()
  // @ts-expect-error pilot-relative methods require AnchoredSeniorityLens.
  lens.trajectory()
}

function assertAnchoredLensCapabilities(lens: AnchoredSeniorityLens) {
  // @ts-expect-error qualification scales replace the removed holdability capability.
  lens.holdability()
}

void assertBaseLensCapabilities
void assertAnchoredLensCapabilities

describe('SeniorityLens capabilities', () => {
  it('exposes only organization methods until an anchor is derived', () => {
    const lens = makeLens()
    expect(lens.snapshot).toBe(snapshot)
    expect(lens.retirementsThisYear()).toBe(1)
  })

  it('uses the canonical snapshot entry as its anchor', () => {
    const lens = makeLens()
    const anchored = lens.withAnchor('E4')
    expect(anchored.anchor).toBe(snapshot.byEmployeeNumber.get('E4'))
    expect(anchored.snapshot).toBe(lens.snapshot)
    expect(lens).not.toHaveProperty('anchor')
  })

  it('throws a clear error for absent anchors and leaves the base lens unchanged', () => {
    const lens = makeLens()
    expect(() => lens.withAnchor('missing')).toThrow(AnchorNotFoundError)
    expect(lens.upcomingRetirements({ yearsHorizon: 30 })).toHaveLength(4)
  })

  it('creates independent derived lenses with a shared immutable context', () => {
    const lens = makeLens()
    const e3 = lens.withAnchor('E3')
    const e4 = lens.withAnchor('E4')
    const scenario = createScenario({ projectionDate: asOfDate })
    expect(e3.standing()).not.toEqual(e4.standing())
    expect(e3.trajectory(projectionEndDate, scenario)).not.toBe(e4.trajectory(projectionEndDate, scenario))
    expect(e3.retirementWave(scenario)).toBe(e4.retirementWave(scenario))
    expect(lens.retirementWave(scenario)).toBe(e3.retirementWave(scenario))
  })
})

describe('organization analysis', () => {
  it('requires an explicit retirement projection end date', () => {
    const lens = makeLens()
    const anchored = lens.withAnchor('E4')
    const result = anchored.retirementProjection({ through: projectionEndDate })
    expect(result.labels.at(-1)).toBe('Jun 2060')
  })

  it('applies retirement projection scenarios', () => {
    const result = makeLens().retirementProjection({
      through: projectionEndDate,
      scenario: createScenario({ projectionDate: asOfDate, scopeFilter: { seat: 'CA' } }),
    })
    expect(result.filteredTotal).toBe(3)
  })

  it('returns organization retirement rows without relative rank', () => {
    const rows = makeLens().upcomingRetirements({ yearsHorizon: 30, base: 'JFK' })
    expect(rows.map(row => row.employeeNumber)).toEqual(['E2', 'E4'])
    expect(rows.every(row => !('rankRelativeToAnchor' in row))).toBe(true)
  })

  it('shares organization results with anchored lenses', () => {
    const lens = makeLens()
    const anchored = lens.withAnchor('E4')
    const scenario = createScenario({ projectionDate: asOfDate })
    expect(anchored.demographics(65, scenario)).toBe(lens.demographics(65, scenario))
    expect(anchored.retirementWave(scenario)).toBe(lens.retirementWave(scenario))
  })

  it('returns scoped organization demographics and retirement waves at the lens date', () => {
    const lens = makeLens()
    const captainScenario = createScenario({ projectionDate: asOfDate, scopeFilter: { seat: 'CA' } })
    expect(lens.demographics(65, captainScenario).qualComposition).toEqual([
      expect.objectContaining({ fleet: '737', seat: 'CA', total: 3 }),
    ])
    expect(lens.retirementWave(captainScenario)).toEqual([
      { year: 2025, count: 1, isWave: false }, { year: 2026, count: 1, isWave: false }, { year: 2045, count: 1, isWave: false },
    ])
  })
})

describe('pilot-relative analysis', () => {
  const anchored = makeLens().withAnchor('E4')

  it('computes standing and trajectory from the canonical anchor', () => {
    expect(anchored.standing().rank).toBe(4)
    expect(anchored.standing().adjustedRank).toBe(3)
    expect(anchored.trajectory(projectionEndDate).points[0]?.date.toString()).toBe('2026-06-15')
  })

  it('memoizes pilot-relative methods per derived lens', () => {
    const scenario = createScenario({ projectionDate: asOfDate })
    expect(anchored.trajectory(projectionEndDate, scenario)).toBe(anchored.trajectory(projectionEndDate, scenario))
    expect(anchored.standing()).toBe(anchored.standing())
  })

  it('returns relative retirement rows and applies senior-only filtering', () => {
    const all = anchored.upcomingRetirementsRelativeToAnchor({ yearsHorizon: 30, seniorOnly: false })
    const senior = anchored.upcomingRetirementsRelativeToAnchor({ yearsHorizon: 30, seniorOnly: true })
    expect(all.find(row => row.employeeNumber === 'E2')?.rankRelativeToAnchor).toBe(2)
    expect(senior.map(row => row.employeeNumber)).toEqual(['E2', 'E3'])
    expect(senior.every(row => row.seniorityNumber < anchored.anchor.seniority_number)).toBe(true)
  })

  it('supports the remaining pilot-relative analysis methods', () => {
    const scenario = createScenario({ projectionDate: asOfDate })
    expect(anchored.compareTrajectories(scenario, scenario, projectionEndDate).labels.length).toBeGreaterThan(0)
    expect(anchored.qualScales()).toContainEqual(expect.objectContaining({
      fleet: '737',
      seat: 'CA',
      plugSenNum: 4,
      isHoldable: true,
    }))
    expect(anchored.percentileCrossing(50, projectionEndDate, scenario)).toSatisfy(value => value === null || /^\d{4}$/.test(value.year))
  })

  it('applies qualification scope to percentile crossings', () => {
    const captainScenario = createScenario({ projectionDate: asOfDate, scopeFilter: { seat: 'CA' } })
    const allPilotsScenario = createScenario({ projectionDate: asOfDate })
    expect(anchored.percentileCrossing(90, projectionEndDate, captainScenario)).toEqual({ year: '2027' })
    expect(anchored.percentileCrossing(90, projectionEndDate, allPilotsScenario)).toEqual({ year: '2040' })
  })
})
