// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computeComparison } from './seniority-compare'
import type { Tables } from '#shared/types/database'

type Entry = Tables<'seniority_entries'>

function makeEntry(overrides: Partial<Entry> & { employee_number: string; seniority_number: number }): Entry {
  return {
    id: crypto.randomUUID(),
    list_id: 'list-1',
    hire_date: '2010-01-01',
    name: null,
    seat: 'CA',
    fleet: '737',
    base: 'JFK',
    retire_date: null,
    ...overrides,
  }
}

describe('computeComparison', () => {
  it('detects retired pilots (present in old, absent in new, retire_date <= effective_date)', () => {
    const older = [makeEntry({ employee_number: '100', seniority_number: 1, retire_date: '2025-06-01' })]
    const newer: Entry[] = []
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.retired).toHaveLength(1)
    expect(result.retired[0]!.employee_number).toBe('100')
    expect(result.departed).toHaveLength(0)
  })

  it('detects departed pilots (present in old, absent in new, no/future retire_date)', () => {
    const older = [
      makeEntry({ employee_number: '200', seniority_number: 1, retire_date: null }),
      makeEntry({ employee_number: '201', seniority_number: 2, retire_date: '2030-01-01' }),
    ]
    const newer: Entry[] = []
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.departed).toHaveLength(2)
    expect(result.retired).toHaveLength(0)
  })

  it('detects qual moves (seat, fleet, or base changed)', () => {
    const older = [makeEntry({ employee_number: '300', seniority_number: 1, seat: 'FO', fleet: '737', base: 'JFK' })]
    const newer = [makeEntry({ employee_number: '300', seniority_number: 1, seat: 'CA', fleet: '777', base: 'LAX' })]
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.qualMoves).toHaveLength(1)
    expect(result.qualMoves[0]).toMatchObject({
      old_seat: 'FO', new_seat: 'CA',
      old_fleet: '737', new_fleet: '777',
      old_base: 'JFK', new_base: 'LAX',
    })
  })

  it('detects rank changes', () => {
    const older = [makeEntry({ employee_number: '400', seniority_number: 50 })]
    const newer = [makeEntry({ employee_number: '400', seniority_number: 30 })]
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.rankChanges).toHaveLength(1)
    expect(result.rankChanges[0]).toMatchObject({ old_rank: 50, new_rank: 30, delta: 20 })
  })

  it('detects new hires (in newer, absent from older)', () => {
    const older: Entry[] = []
    const newer = [makeEntry({ employee_number: '500', seniority_number: 100, hire_date: '2025-12-01' })]
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.newHires).toHaveLength(1)
    expect(result.newHires[0]!.employee_number).toBe('500')
  })

  it('handles identical lists (no changes)', () => {
    const entries = [makeEntry({ employee_number: '600', seniority_number: 1 })]
    const result = computeComparison(entries, [...entries], '2026-01-01')
    expect(result.retired).toHaveLength(0)
    expect(result.departed).toHaveLength(0)
    expect(result.qualMoves).toHaveLength(0)
    expect(result.rankChanges).toHaveLength(0)
    expect(result.newHires).toHaveLength(0)
  })

  it('handles empty lists', () => {
    const result = computeComparison([], [], '2026-01-01')
    expect(result.retired).toHaveLength(0)
    expect(result.departed).toHaveLength(0)
    expect(result.qualMoves).toHaveLength(0)
    expect(result.rankChanges).toHaveLength(0)
    expect(result.newHires).toHaveLength(0)
  })

  it('categorizes a pilot as both qual move and rank change when both apply', () => {
    const older = [makeEntry({ employee_number: '700', seniority_number: 10, seat: 'FO' })]
    const newer = [makeEntry({ employee_number: '700', seniority_number: 5, seat: 'CA' })]
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.qualMoves).toHaveLength(1)
    expect(result.rankChanges).toHaveLength(1)
  })
})
