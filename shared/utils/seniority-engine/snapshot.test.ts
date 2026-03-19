// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { makeDomainEntry } from '#shared/test-utils/factories'
import { createSnapshot, InvalidSnapshotDataError } from './snapshot'

describe('createSnapshot', () => {
  const entries = [
    makeDomainEntry({ seniority_number: 3, employee_number: 'E3', base: 'ATL', seat: 'FO', fleet: '737' }),
    makeDomainEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737' }),
    makeDomainEntry({ seniority_number: 2, employee_number: 'E2', base: 'ATL', seat: 'CA', fleet: '320' }),
  ]

  it('preserves original entry order', () => {
    const snap = createSnapshot(entries)
    expect(snap.entries.map(e => e.seniority_number)).toEqual([3, 1, 2])
  })

  it('sorts entries by seniority numbers ascending', () => {
    const snap = createSnapshot(entries)
    expect([...snap.sortedEntries.map(s => s.seniority_number)]).toEqual([1, 2, 3])
  })

  it('groups entries by cell key (base|seat|fleet)', () => {
    const snap = createSnapshot(entries)
    expect(snap.byCell.size).toBe(3)
    expect(snap.byCell.get('ATL|FO|737')?.length).toBe(1)
    expect(snap.byCell.get('JFK|CA|737')?.length).toBe(1)
    expect(snap.byCell.get('ATL|CA|320')?.length).toBe(1)
  })

  it('groups additional entries into existing cells', () => {
    const withExtra = [...entries, makeDomainEntry({ seniority_number: 4, employee_number: 'E4', base: 'ATL', seat: 'CA', fleet: '320' })]
    const snap = createSnapshot(withExtra)
    expect(snap.byCell.size).toBe(3)
    expect(snap.byCell.get('ATL|CA|320')?.length).toBe(2)
  })

  it('throws InvalidSnapshotDataError for entries with missing base/seat/fleet', () => {
    const withNull = [...entries, makeDomainEntry({ seniority_number: 4, employee_number: 'E4', base: '' as unknown as string, seat: 'CA', fleet: '737' })]
    expect(() => createSnapshot(withNull)).toThrow(InvalidSnapshotDataError)
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
    expect(snap.sortedEntries).toHaveLength(0)
    expect(snap.byCell.size).toBe(0)
    expect(snap.quals).toHaveLength(0)
  })
})
