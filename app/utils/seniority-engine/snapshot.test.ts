// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { createSenioritySnapshot, InvalidSenioritySnapshotDataError, validateSnapshotEntries } from './snapshot'
import type { SenioritySnapshot } from './types'

function assertReadonlySnapshot(snapshot: SenioritySnapshot) {
  // @ts-expect-error Snapshot entries are exposed through a readonly array.
  snapshot.entries.push(makeDomainEntry())
  // @ts-expect-error Seniority ordering is exposed through a readonly array.
  snapshot.entriesBySeniority.reverse()
  // @ts-expect-error Employee lookup is exposed through ReadonlyMap.
  snapshot.entriesByEmployeeNumber.set('NEW', makeDomainEntry())
  // @ts-expect-error Qualification lookup is exposed through ReadonlyMap.
  snapshot.entriesByQualification.clear()
  const qualificationEntries = snapshot.entriesByQualification.values().next().value
  if (qualificationEntries) {
    // @ts-expect-error Qualification groups are readonly arrays.
    qualificationEntries.push(makeDomainEntry())
  }
  // @ts-expect-error Qualification values are readonly.
  snapshot.qualifications[0]!.base = 'LAX'
}

void assertReadonlySnapshot

describe('createSenioritySnapshot', () => {
  const entries = [
    makeDomainEntry({ seniority_number: 3, employee_number: 'E3', base: 'ATL', seat: 'FO', fleet: '737' }),
    makeDomainEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737' }),
    makeDomainEntry({ seniority_number: 2, employee_number: 'E2', base: 'ATL', seat: 'CA', fleet: '320' }),
  ]

  it('preserves original entry order', () => {
    const snap = createSenioritySnapshot(entries)
    expect(snap.entries.map(e => e.seniority_number)).toEqual([3, 1, 2])
  })

  it('sorts entries by seniority numbers ascending', () => {
    const snap = createSenioritySnapshot(entries)
    expect([...snap.entriesBySeniority.map(s => s.seniority_number)]).toEqual([1, 2, 3])
  })

  it('groups entries by Qualification key (base|seat|fleet)', () => {
    const snap = createSenioritySnapshot(entries)
    expect(snap.entriesByQualification.size).toBe(3)
    expect(snap.entriesByQualification.get('ATL|FO|737')?.length).toBe(1)
    expect(snap.entriesByQualification.get('JFK|CA|737')?.length).toBe(1)
    expect(snap.entriesByQualification.get('ATL|CA|320')?.length).toBe(1)
  })

  it('groups additional entries into existing Qualifications', () => {
    const withExtra = [...entries, makeDomainEntry({ seniority_number: 4, employee_number: 'E4', base: 'ATL', seat: 'CA', fleet: '320' })]
    const snap = createSenioritySnapshot(withExtra)
    expect(snap.entriesByQualification.size).toBe(3)
    expect(snap.entriesByQualification.get('ATL|CA|320')?.length).toBe(2)
  })

  it('throws InvalidSenioritySnapshotDataError for entries with missing base/seat/fleet', () => {
    const withNull = [...entries, makeDomainEntry({ seniority_number: 4, employee_number: 'E4', base: '' as unknown as string, seat: 'CA', fleet: '737' })]
    expect(() => createSenioritySnapshot(withNull)).toThrow(InvalidSenioritySnapshotDataError)
  })

  it('indexes entries by employee number', () => {
    const snap = createSenioritySnapshot(entries)
    expect(snap.entriesByEmployeeNumber.get('E2')?.seniority_number).toBe(2)
  })

  it('extracts unique sorted base/seat/fleet values', () => {
    const snap = createSenioritySnapshot(entries)
    expect([...snap.bases]).toEqual(['ATL', 'JFK'])
    expect([...snap.seats]).toEqual(['CA', 'FO'])
    expect([...snap.fleets]).toEqual(['320', '737'])
  })

  it('builds sorted domain Qualifications without display labels', () => {
    const snap = createSenioritySnapshot(entries)
    expect(snap.qualifications).toEqual([
      { base: 'ATL', seat: 'CA', fleet: '320' },
      { base: 'ATL', seat: 'FO', fleet: '737' },
      { base: 'JFK', seat: 'CA', fleet: '737' },
    ])
    expect(snap.qualifications.every(qualification => !('label' in qualification))).toBe(true)
  })

  it('handles empty entries', () => {
    const snap = createSenioritySnapshot([])
    expect(snap.entries).toHaveLength(0)
    expect(snap.entriesBySeniority).toHaveLength(0)
    expect(snap.entriesByQualification.size).toBe(0)
    expect(snap.qualifications).toHaveLength(0)
  })
})

describe('validateSnapshotEntries', () => {
  it('returns empty map for valid entries with unique seniority and employee numbers', () => {
    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E1' }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'E2' }),
    ]
    expect(validateSnapshotEntries(entries).size).toBe(0)
  })

  it('flags all rows sharing a duplicate seniority number', () => {
    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E1' }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'E2' }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'E3' }),
    ]
    const errors = validateSnapshotEntries(entries)
    expect(errors.has(1)).toBe(true)
    expect(errors.has(2)).toBe(true)
    const allErrors = Array.from(errors.values()).flat()
    expect(allErrors.some(e => e.includes('Duplicate seniority number 2'))).toBe(true)
  })

  it('flags all rows sharing a duplicate employee number', () => {
    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'SAME' }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'SAME' }),
    ]
    const errors = validateSnapshotEntries(entries)
    expect(errors.has(0)).toBe(true)
    expect(errors.has(1)).toBe(true)
    const allErrors = Array.from(errors.values()).flat()
    expect(allErrors.some(e => e.includes('Duplicate employee number SAME'))).toBe(true)
  })

  it('uses normalized identity when validating duplicate employee numbers', () => {
    const errors = validateSnapshotEntries([
      makeDomainEntry({ seniority_number: 100, employee_number: '00123' }),
      makeDomainEntry({ seniority_number: 105, employee_number: '123' }),
    ])

    expect([...errors.keys()]).toEqual([0, 1])
    expect(Array.from(errors.values()).flat()).toContain('employee_number: Duplicate employee number 123')
  })

  it('reports both duplicate seniority and employee number violations in the same pass', () => {
    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'DUP' }),
      makeDomainEntry({ seniority_number: 1, employee_number: 'DUP' }),
    ]
    const errors = validateSnapshotEntries(entries)
    const allErrors = Array.from(errors.values()).flat()
    expect(allErrors.some(e => e.includes('Duplicate seniority number'))).toBe(true)
    expect(allErrors.some(e => e.includes('Duplicate employee number'))).toBe(true)
  })

  it('does not flag empty employee_number as a duplicate', () => {
    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: '' }),
      makeDomainEntry({ seniority_number: 2, employee_number: '' }),
    ]
    const errors = validateSnapshotEntries(entries)
    expect(Array.from(errors.values()).flat().some(e => e.includes('Duplicate employee number'))).toBe(false)
  })
})
