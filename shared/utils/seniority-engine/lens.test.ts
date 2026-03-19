// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { makeEntry } from '#shared/test-utils/factories'
import { createSnapshot } from './snapshot'
import { createLens } from './lens'

// Fix "today" for deterministic retirement calculations
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15'))
})
afterAll(() => {
  vi.useRealTimers()
})

const entries = [
  makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2000-01-01', retire_date: '2025-06-01' }), // already retired
  makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2005-01-01', retire_date: '2026-12-01' }), // retires this year, senior to user
  makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'ATL', seat: 'FO', fleet: '320', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
  makeEntry({ seniority_number: 4, employee_number: 'E4', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2015-01-01', retire_date: '2045-01-01' }), // the user
  makeEntry({ seniority_number: 5, employee_number: 'E5', base: 'ATL', seat: 'FO', fleet: '320', hire_date: '2020-01-01', retire_date: '2050-01-01' }),
]

const snapshot = createSnapshot(entries)
const anchor = { seniorityNumber: 4, retireDate: '2045-01-01', employeeNumber: 'E4' }

describe('createLens', () => {
  it('exposes snapshot and anchor', () => {
    const lens = createLens(snapshot, anchor)
    expect(lens.snapshot).toBe(snapshot)
    expect(lens.anchor).toEqual(anchor)
  })

  it('works without anchor', () => {
    const lens = createLens(snapshot)
    expect(lens.anchor).toBeNull()
  })
})

describe('standing()', () => {
  const lens = createLens(snapshot, anchor)

  it('returns null when no anchor', () => {
    const noAnchor = createLens(snapshot)
    expect(noAnchor.standing()).toBeNull()
  })

  it('computes company-wide rank', () => {
    const result = lens.standing()!
    // User is seniority_number 4 → 3 entries ahead (1, 2, 3) → rank 4
    expect(result.rank).toBe(4)
    expect(result.total).toBe(5)
  })

  it('adjusts rank by subtracting retired pilots above', () => {
    const result = lens.standing()!
    // E1 (sen#1, retired 2025-06-01) is retired and senior → retiredAbove = 1
    expect(result.retiredAbove).toBe(1)
    expect(result.adjustedRank).toBe(3) // rank 4 - 1 retired above
  })

  it('counts retirements this year', () => {
    const result = lens.standing()!
    // E2 retires 2026-12-01 → retires this year
    expect(result.retirementsThisYear).toBe(1)
  })

  it('counts retirements this year senior to anchor', () => {
    const result = lens.standing()!
    // E2 (sen#2) retires this year and is senior to user (sen#4)
    expect(result.retirementsThisYearSeniorToAnchor).toBe(1)
  })

  it('computes cell breakdown with per-cell ranks', () => {
    const result = lens.standing()!
    const jfkCA737 = result.cellBreakdown.find(
      c => c.base === 'JFK' && c.seat === 'CA' && c.fleet === '737',
    )!
    // JFK/CA/737 has E1 (retired), E2, E4 → total 3
    expect(jfkCA737.total).toBe(3)
    // User (E4, sen#4) is rank 3 of 3 in this cell
    expect(jfkCA737.rank).toBe(3)
    // E1 is retired and senior to user in this cell → adjustedRank = 2
    expect(jfkCA737.adjustedRank).toBe(2)
    expect(jfkCA737.isAnchorCurrent).toBe(true) // user's current cell
  })

  it('marks non-user cells as isAnchorCurrent=false', () => {
    const result = lens.standing()!
    const atlFO320 = result.cellBreakdown.find(
      c => c.base === 'ATL' && c.seat === 'FO' && c.fleet === '320',
    )!
    expect(atlFO320.isAnchorCurrent).toBe(false)
  })
})
