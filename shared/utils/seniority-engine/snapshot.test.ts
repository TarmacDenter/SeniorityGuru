// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { makeEntry } from '#shared/test-utils/factories'
import { createSnapshot } from './snapshot'

describe('createSnapshot', () => {
  const entries = [
    makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'ATL', seat: 'FO', fleet: '737' }),
    makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737' }),
    makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'ATL', seat: 'CA', fleet: '320' }),
  ]

  it('preserves original entry order', () => {
    const snap = createSnapshot(entries)
    expect(snap.entries.map(e => e.seniority_number)).toEqual([3, 1, 2])
  })

  it('sorts seniority numbers ascending', () => {
    const snap = createSnapshot(entries)
    expect([...snap.sortedSenNums]).toEqual([1, 2, 3])
  })

  it('groups entries by cell key (base|seat|fleet)', () => {
    const snap = createSnapshot(entries)
    expect(snap.byCell.size).toBe(3)
    expect(snap.byCell.get('ATL|FO|737')?.length).toBe(1)
    expect(snap.byCell.get('JFK|CA|737')?.length).toBe(1)
    expect(snap.byCell.get('ATL|CA|320')?.length).toBe(1)
  })

  it('skips entries with null base/seat/fleet in cell grouping', () => {
    const withNull = [...entries, makeEntry({ seniority_number: 4, base: null, seat: 'CA', fleet: '737' })]
    const snap = createSnapshot(withNull)
    expect(snap.byCell.size).toBe(3) // null-base entry excluded
  })

  it('indexes entries by employee number', () => {
    const snap = createSnapshot(entries)
    expect(snap.byEmployeeNumber.get('E2')?.seniority_number).toBe(2)
  })

  it('extracts unique sorted base/seat/fleet values', () => {
    const snap = createSnapshot(entries)
    expect([...snap.uniqueBases]).toEqual(['ATL', 'JFK'])
    expect([...snap.uniqueSeats]).toEqual(['CA', 'FO'])
    expect([...snap.uniqueFleets]).toEqual(['320', '737'])
  })

  it('builds sorted qual labels', () => {
    const snap = createSnapshot(entries)
    const labels = snap.quals.map(q => q.label)
    expect(labels).toEqual(['CA/320/ATL', 'CA/737/JFK', 'FO/737/ATL'])
  })

  it('handles empty entries', () => {
    const snap = createSnapshot([])
    expect(snap.entries).toHaveLength(0)
    expect(snap.sortedSenNums).toHaveLength(0)
    expect(snap.byCell.size).toBe(0)
    expect(snap.quals).toHaveLength(0)
  })
})
