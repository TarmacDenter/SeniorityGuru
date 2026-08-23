// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { analyzeSeniorityQualificationViewer } from './qual-viewer'

const entries = [
  makeDomainEntry({ seniority_number: 1, employee_number: 'A', base: 'BOS', fleet: '220', seat: 'CA', retire_date: '2026-06-15' }),
  makeDomainEntry({ seniority_number: 2, employee_number: 'B', base: 'BOS', fleet: '220', seat: 'CA', retire_date: '2030-01-01' }),
  makeDomainEntry({ seniority_number: 3, employee_number: 'C', base: 'JFK', fleet: '737', seat: 'FO', retire_date: '2040-01-01' }),
  makeDomainEntry({ seniority_number: 4, employee_number: 'D', base: 'BOS', fleet: '220', seat: 'CA', retire_date: '2040-01-01' }),
]

describe('analyzeSeniorityQualificationViewer', () => {
  it('projects the company-wide selected list in company order', () => {
    const result = analyzeSeniorityQualificationViewer({ entries, asOfDate: '2026-06-15' })
    expect(result.entries.map(row => row.employeeNumber)).toEqual(['A', 'B', 'C', 'D'])
    expect(result.entries[0]).toMatchObject({ status: 'retired', companyRank: null, qualificationRank: null, listRank: 1 })
    expect(result.entries[1]).toMatchObject({ status: 'active', companyRank: 1, companyPercentile: 100, qualificationRank: 1, qualificationPercentile: 100 })
  })

  it('filters only exact full qualifications', () => {
    const result = analyzeSeniorityQualificationViewer({ entries, qualificationScope: { base: 'BOS', fleet: '220', seat: 'CA' }, asOfDate: '2026-06-16' })
    expect(result.entries.map(row => row.employeeNumber)).toEqual(['A', 'B', 'D'])
    expect(result.entries.map(row => row.qualificationRank)).toEqual([null, 1, 2])
  })

  it('highlights the real entry when inserting the anchor into its current Qualification', () => {
    const result = analyzeSeniorityQualificationViewer({ entries, qualificationScope: { base: 'BOS', fleet: '220', seat: 'CA' }, employeeNumber: 'B', insertSelf: true, asOfDate: '2026-06-16' })
    expect(result.entries.filter(row => row.employeeNumber === 'B')).toHaveLength(1)
    expect(result.entries.find(row => row.employeeNumber === 'B')).toMatchObject({ isAnchor: true, isMarker: false })
  })

  it('uses normalized identity for the real entry with or without marker insertion', () => {
    const options = { entries, qualificationScope: { base: 'BOS', fleet: '220', seat: 'CA' }, employeeNumber: '123', asOfDate: '2026-06-16' }
    const paddedEntries = entries.map((entry, index) => index === 1 ? { ...entry, employee_number: '00123' } : entry)

    for (const insertSelf of [true, false]) {
      const result = analyzeSeniorityQualificationViewer({ ...options, entries: paddedEntries, insertSelf })
      expect(result.entries.find(row => row.employeeNumber === '00123')).toMatchObject({ isAnchor: true, isMarker: false })
    }
  })

  it('inserts a marker into another Qualification and shifts affected active Ranks', () => {
    const result = analyzeSeniorityQualificationViewer({ entries, qualificationScope: { base: 'JFK', fleet: '737', seat: 'FO' }, employeeNumber: 'B', insertSelf: true, asOfDate: '2026-06-16' })
    expect(result.entries).toHaveLength(2)
    expect(result.entries[0]).toMatchObject({ employeeNumber: 'B', status: 'inserted', isMarker: true, qualificationRank: 1, qualificationPercentile: 100 })
    expect(result.entries[1]).toMatchObject({ employeeNumber: 'C', qualificationRank: 2, qualificationPercentile: 50 })
  })

  it('places the marker between matching pilots at the employee company seniority position', () => {
    const middleEntries = [
      makeDomainEntry({ seniority_number: 10, employee_number: 'Q1', base: 'JFK', fleet: '737', seat: 'FO', retire_date: '2040-01-01' }),
      makeDomainEntry({ seniority_number: 20, employee_number: 'Q2', base: 'JFK', fleet: '737', seat: 'FO', retire_date: '2040-01-01' }),
      makeDomainEntry({ seniority_number: 30, employee_number: 'USER', base: 'BOS', fleet: '220', seat: 'CA', retire_date: '2040-01-01' }),
      makeDomainEntry({ seniority_number: 40, employee_number: 'Q3', base: 'JFK', fleet: '737', seat: 'FO', retire_date: '2040-01-01' }),
    ]
    const result = analyzeSeniorityQualificationViewer({ entries: middleEntries, qualificationScope: { base: 'JFK', fleet: '737', seat: 'FO' }, employeeNumber: 'USER', insertSelf: true, asOfDate: '2026-06-15' })
    expect(result.entries.map(row => row.employeeNumber)).toEqual(['Q1', 'Q2', 'USER', 'Q3'])
    expect(result.entries[2]).toMatchObject({ isMarker: true, status: 'inserted', qualificationRank: 3 })
  })

  it('uses positional ranks for real rows and inserted markers when Seniority Numbers have gaps', () => {
    const gappedEntries = [
      makeDomainEntry({ seniority_number: 100, employee_number: 'Q1', base: 'JFK', fleet: '737', seat: 'FO' }),
      makeDomainEntry({ seniority_number: 105, employee_number: 'USER', base: 'BOS', fleet: '220', seat: 'CA' }),
      makeDomainEntry({ seniority_number: 110, employee_number: 'Q2', base: 'JFK', fleet: '737', seat: 'FO' }),
      makeDomainEntry({ seniority_number: 125, employee_number: 'Q3', base: 'JFK', fleet: '737', seat: 'FO' }),
    ]

    const result = analyzeSeniorityQualificationViewer({
      entries: gappedEntries,
      qualificationScope: { base: 'JFK', fleet: '737', seat: 'FO' },
      employeeNumber: 'USER',
      insertSelf: true,
      asOfDate: '2026-06-15',
    })

    expect(result.entries.map(row => ({
      employeeNumber: row.employeeNumber,
      listRank: row.listRank,
      listPercentile: row.listPercentile,
      companyRank: row.companyRank,
      companyPercentile: row.companyPercentile,
      qualificationRank: row.qualificationRank,
      qualificationPercentile: row.qualificationPercentile,
    }))).toEqual([
      { employeeNumber: 'Q1', listRank: 1, listPercentile: 100, companyRank: 1, companyPercentile: 100, qualificationRank: 1, qualificationPercentile: 100 },
      { employeeNumber: 'USER', listRank: 2, listPercentile: 75, companyRank: 2, companyPercentile: 75, qualificationRank: 2, qualificationPercentile: 75 },
      { employeeNumber: 'Q2', listRank: 3, listPercentile: 50, companyRank: 3, companyPercentile: 50, qualificationRank: 3, qualificationPercentile: 50 },
      { employeeNumber: 'Q3', listRank: 4, listPercentile: 25, companyRank: 4, companyPercentile: 25, qualificationRank: 4, qualificationPercentile: 25 },
    ])
  })

  it('keeps a retired inserted employee visible without current ranks', () => {
    const result = analyzeSeniorityQualificationViewer({ entries, qualificationScope: { base: 'JFK', fleet: '737', seat: 'FO' }, employeeNumber: 'A', insertSelf: true, asOfDate: '2026-06-15' })
    expect(result.entries[0]).toMatchObject({ status: 'retired', companyRank: null, companyPercentile: null, qualificationRank: null })
  })

  it('does not allow insertion when the employee is absent', () => {
    const result = analyzeSeniorityQualificationViewer({ entries, qualificationScope: { base: 'JFK', fleet: '737', seat: 'FO' }, employeeNumber: 'missing', insertSelf: true, asOfDate: '2026-06-15' })
    expect(result.canInsert).toBe(false)
    expect(result.entries).toHaveLength(1)
  })
})
