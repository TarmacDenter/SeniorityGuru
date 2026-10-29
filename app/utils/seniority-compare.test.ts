// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computeComparison } from './seniority-compare'
import type { SeniorityEntry, SeniorityEntryInput } from '~/utils/schemas/seniority-list'
import { makeDomainEntry } from '~/test-utils/factories'

function makeEntry(overrides: Partial<SeniorityEntryInput> & { employee_number: string; seniority_number: number }): SeniorityEntry {
  return makeDomainEntry({
    hire_date: '2010-01-01',
    retire_date: '2055-01-01',
    seat: 'CA',
    fleet: '737',
    base: 'JFK',
    ...overrides,
  })
}

describe('computeComparison', () => {
  it.each([['000123', '123'], ['123', '000123'], ['000', '0']])(
    'matches unchanged numeric identity %s with %s',
    (olderNumber, newerNumber) => {
      const older = [makeEntry({ employee_number: olderNumber, seniority_number: 10 })]
      const newer = [makeEntry({ employee_number: newerNumber, seniority_number: 10 })]
      const result = computeComparison(older, newer, '2026-01-01')
      expect(Object.values(result).every(changes => changes.length === 0)).toBe(true)
    },
  )

  it.each([['000123', '123'], ['123', '000123'], ['000', '0']])(
    'retains number and Qualification changes for %s matched with %s using newer formatting',
    (olderNumber, newerNumber) => {
      const older = [makeEntry({ employee_number: olderNumber, seniority_number: 50, seat: 'FO' })]
      const newer = [makeEntry({ employee_number: newerNumber, seniority_number: 30, seat: 'CA' })]
      const result = computeComparison(older, newer, '2026-01-01')
      expect(result.retired).toEqual([])
      expect(result.departed).toEqual([])
      expect(result.newHires).toEqual([])
      expect(result.qualMoves).toMatchObject([{ employee_number: newerNumber, old_seat: 'FO', new_seat: 'CA' }])
      expect(result.seniorityNumberChanges).toMatchObject([{ employee_number: newerNumber, old_seniority_number: 50, new_seniority_number: 30, delta: 20 }])
    },
  )

  it('keeps alphanumeric identities exact and preserves unmatched source formatting', () => {
    const older = [
      makeEntry({ employee_number: '00A123', seniority_number: 10 }),
      makeEntry({ employee_number: '000456', seniority_number: 20 }),
      makeEntry({ employee_number: '000789', seniority_number: 30, retire_date: '2025-12-31' }),
      makeEntry({ employee_number: 'A123', seniority_number: 40 }),
    ]
    const newer = [
      makeEntry({ employee_number: 'A123', seniority_number: 40 }),
      makeEntry({ employee_number: 'a123', seniority_number: 50 }),
      makeEntry({ employee_number: '000999', seniority_number: 60 }),
    ]
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.departed.map(pilot => pilot.employee_number)).toEqual(['00A123', '000456'])
    expect(result.retired.map(pilot => pilot.employee_number)).toEqual(['000789'])
    expect(result.newHires.map(pilot => pilot.employee_number)).toEqual(['a123', '000999'])
    expect(result.qualMoves).toEqual([])
    expect(result.seniorityNumberChanges).toEqual([])
  })

  it('detects retired pilots (present in old, absent in new, retire_date <= effective_date)', () => {
    const older = [makeEntry({ employee_number: '100', seniority_number: 1, retire_date: '2025-06-01' })]
    const newer: SeniorityEntry[] = []
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.retired).toHaveLength(1)
    expect(result.retired[0]!.employee_number).toBe('100')
    expect(result.departed).toHaveLength(0)
  })

  it('detects departed pilots (present in old, absent in new, no/future retire_date)', () => {
    const older = [
      makeEntry({ employee_number: '200', seniority_number: 1 }),
      makeEntry({ employee_number: '201', seniority_number: 2, retire_date: '2030-01-01' }),
    ]
    const newer: SeniorityEntry[] = []
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

  it('detects Seniority Number changes', () => {
    const older = [makeEntry({ employee_number: '400', seniority_number: 50 })]
    const newer = [makeEntry({ employee_number: '400', seniority_number: 30 })]
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.seniorityNumberChanges).toHaveLength(1)
    expect(result.seniorityNumberChanges[0]).toMatchObject({ old_seniority_number: 50, new_seniority_number: 30, delta: 20 })
  })

  it('retains every assigned-number change in a uniformly renumbered gapped list', () => {
    const older = [
      makeEntry({ employee_number: '100', seniority_number: 10 }),
      makeEntry({ employee_number: '200', seniority_number: 30 }),
      makeEntry({ employee_number: '300', seniority_number: 90 }),
    ]
    const newer = [
      makeEntry({ employee_number: '100', seniority_number: 110 }),
      makeEntry({ employee_number: '200', seniority_number: 130 }),
      makeEntry({ employee_number: '300', seniority_number: 190 }),
    ]
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.seniorityNumberChanges).toMatchObject([
      { employee_number: '100', old_seniority_number: 10, new_seniority_number: 110, delta: -100 },
      { employee_number: '200', old_seniority_number: 30, new_seniority_number: 130, delta: -100 },
      { employee_number: '300', old_seniority_number: 90, new_seniority_number: 190, delta: -100 },
    ])
    expect(result.retired).toEqual([])
    expect(result.departed).toEqual([])
    expect(result.newHires).toEqual([])
    expect(result.qualMoves).toEqual([])
  })

  it('detects new hires (in newer, absent from older)', () => {
    const older: SeniorityEntry[] = []
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
    expect(result.seniorityNumberChanges).toHaveLength(0)
    expect(result.newHires).toHaveLength(0)
  })

  it('handles empty lists', () => {
    const result = computeComparison([], [], '2026-01-01')
    expect(result.retired).toHaveLength(0)
    expect(result.departed).toHaveLength(0)
    expect(result.qualMoves).toHaveLength(0)
    expect(result.seniorityNumberChanges).toHaveLength(0)
    expect(result.newHires).toHaveLength(0)
  })

  it('categorizes a pilot as both qual move and Seniority Number change when both apply', () => {
    const older = [makeEntry({ employee_number: '700', seniority_number: 10, seat: 'FO' })]
    const newer = [makeEntry({ employee_number: '700', seniority_number: 5, seat: 'CA' })]
    const result = computeComparison(older, newer, '2026-01-01')
    expect(result.qualMoves).toHaveLength(1)
    expect(result.seniorityNumberChanges).toHaveLength(1)
  })
})
