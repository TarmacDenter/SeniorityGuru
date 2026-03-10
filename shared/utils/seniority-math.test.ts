// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { countRetiredAbove, generateTimePoints, buildTrajectory, computeRank, getProjectionEndDate, formatDateLabel, formatNumber } from './seniority-math'
import type { Tables } from '#shared/types/database'

type SeniorityEntry = Tables<'seniority_entries'>

function makeEntry(overrides: Partial<SeniorityEntry> = {}): SeniorityEntry {
  return {
    id: 'entry-1',
    list_id: 'list-1',
    seniority_number: 1,
    employee_number: '100',
    name: 'Test Pilot',
    hire_date: '2010-01-15',
    base: 'JFK',
    seat: 'CA',
    fleet: '737',
    retire_date: '2035-06-15',
    ...overrides,
  }
}

describe('countRetiredAbove', () => {
  it('returns 0 when no entries have retired', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2041-01-01' }),
    ]
    const result = countRetiredAbove(entries, 3, new Date('2026-06-01'))
    expect(result).toBe(0)
  })

  it('counts only entries with seniority_number < userSenNum AND retire_date <= asOfDate', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2025-01-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2025-06-01' }),
      makeEntry({ seniority_number: 3, retire_date: '2025-01-01' }),
      makeEntry({ seniority_number: 4, retire_date: '2024-01-01' }),
      makeEntry({ seniority_number: 1, retire_date: '2030-01-01' }),
    ]
    const result = countRetiredAbove(entries, 3, new Date('2026-01-01'))
    expect(result).toBe(2)
  })

  it('respects filterFn', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2025-01-01', base: 'JFK' }),
      makeEntry({ seniority_number: 2, retire_date: '2025-01-01', base: 'LAX' }),
    ]
    const result = countRetiredAbove(entries, 5, new Date('2026-01-01'), (e) => e.base === 'JFK')
    expect(result).toBe(1)
  })

  it('handles null retire_date (should NOT count as retired)', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: null }),
      makeEntry({ seniority_number: 2, retire_date: null }),
    ]
    const result = countRetiredAbove(entries, 5, new Date('2026-01-01'))
    expect(result).toBe(0)
  })
})

describe('generateTimePoints', () => {
  it('generates yearly points', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2031-01-01')
    const points = generateTimePoints(start, end)
    expect(points.length).toBe(6)
    expect(points[0]!.toISOString().split('T')[0]).toBe('2026-01-01')
    expect(points[1]!.toISOString().split('T')[0]).toBe('2027-01-01')
    for (const p of points) {
      expect(p.getTime()).toBeLessThanOrEqual(end.getTime())
    }
  })

  it('generates correct number of points for long range', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2040-01-01')
    const points = generateTimePoints(start, end)
    expect(points.length).toBe(15)
    expect(points[points.length - 1]!.toISOString().split('T')[0]).toBe('2040-01-01')
  })

  it('stops at or before endDate', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2038-06-15')
    const points = generateTimePoints(start, end)
    for (const p of points) {
      expect(p.getTime()).toBeLessThanOrEqual(end.getTime())
    }
  })

  it('handles short range', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2027-06-01')
    const points = generateTimePoints(start, end)
    expect(points.length).toBe(2)
    for (const p of points) {
      expect(p.getTime()).toBeLessThanOrEqual(end.getTime())
    }
  })
})

describe('buildTrajectory', () => {
  it('returns decreasing rank over time as retirements accumulate', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2026-06-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2027-06-01' }),
      makeEntry({ seniority_number: 3, retire_date: '2028-06-01' }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
    ]
    const timePoints = [
      new Date('2026-01-01'),
      new Date('2026-12-01'),
      new Date('2027-12-01'),
      new Date('2028-12-01'),
    ]
    const trajectory = buildTrajectory(entries, 5, timePoints)
    expect(trajectory).toEqual([
      { date: '2026-01-01', rank: 4, percentile: 25 },
      { date: '2026-12-01', rank: 3, percentile: 50 },
      { date: '2027-12-01', rank: 2, percentile: 75 },
      { date: '2028-12-01', rank: 1, percentile: 100 },
    ])
  })

  it('returns empty array when no time points', () => {
    const entries = [makeEntry({ seniority_number: 1 })]
    const trajectory = buildTrajectory(entries, 5, [])
    expect(trajectory).toEqual([])
  })

  it('handles entries with no retire_date', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: null }),
      makeEntry({ seniority_number: 2, retire_date: null }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
    ]
    const timePoints = [new Date('2030-01-01'), new Date('2035-01-01')]
    const trajectory = buildTrajectory(entries, 5, timePoints)
    expect(trajectory).toEqual([
      { date: '2030-01-01', rank: 3, percentile: 33.3 },
      { date: '2035-01-01', rank: 3, percentile: 33.3 },
    ])
  })
})

describe('computeRank', () => {
  it('returns 1 when user is most senior', () => {
    const entries = [
      makeEntry({ seniority_number: 5 }),
      makeEntry({ seniority_number: 10 }),
    ]
    expect(computeRank(entries, 5)).toBe(1)
  })

  it('returns correct rank when entries are ahead', () => {
    const entries = [
      makeEntry({ seniority_number: 1 }),
      makeEntry({ seniority_number: 2 }),
      makeEntry({ seniority_number: 5 }),
    ]
    expect(computeRank(entries, 5)).toBe(3)
  })
})

describe('getProjectionEndDate', () => {
  it('returns retire date when provided', () => {
    const { endDate } = getProjectionEndDate('2040-06-15')
    expect(endDate.getFullYear()).toBe(2040)
  })

  it('defaults to 30 years from now when null', () => {
    const { today, endDate } = getProjectionEndDate(null)
    expect(endDate.getFullYear()).toBe(today.getFullYear() + 30)
  })
})

describe('formatDateLabel', () => {
  it('formats YYYY-MM-DD to Mon YYYY', () => {
    expect(formatDateLabel('2026-01-15')).toBe('Jan 2026')
  })
})

describe('formatNumber', () => {
  it('formats numbers with locale separators', () => {
    expect(typeof formatNumber(1000)).toBe('string')
  })
})
