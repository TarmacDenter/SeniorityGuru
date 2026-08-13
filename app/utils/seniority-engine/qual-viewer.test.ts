// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { projectQualViewer } from './qual-viewer'

const entries = [
  makeDomainEntry({ seniority_number: 1, employee_number: 'A', base: 'BOS', fleet: '220', seat: 'CA', retire_date: '2026-06-15' }),
  makeDomainEntry({ seniority_number: 2, employee_number: 'B', base: 'BOS', fleet: '220', seat: 'CA', retire_date: '2030-01-01' }),
  makeDomainEntry({ seniority_number: 3, employee_number: 'C', base: 'JFK', fleet: '737', seat: 'FO', retire_date: '2040-01-01' }),
  makeDomainEntry({ seniority_number: 4, employee_number: 'D', base: 'BOS', fleet: '220', seat: 'CA', retire_date: '2040-01-01' }),
]

describe('projectQualViewer', () => {
  it('projects the company-wide selected list in company order', () => {
    const result = projectQualViewer({ entries, asOfDate: '2026-06-15' })
    expect(result.rows.map(row => row.employeeNumber)).toEqual(['A', 'B', 'C', 'D'])
    expect(result.rows[0]).toMatchObject({ status: 'retired', companySeniority: null, qualSeniority: null, selectedListCompanySeniority: 1 })
    expect(result.rows[1]).toMatchObject({ status: 'active', companySeniority: 1, companyPercentile: 100, qualSeniority: 1, qualPercentile: 100 })
  })

  it('filters only exact full quals', () => {
    const result = projectQualViewer({ entries, qual: { base: 'BOS', fleet: '220', seat: 'CA' }, asOfDate: '2026-06-16' })
    expect(result.rows.map(row => row.employeeNumber)).toEqual(['A', 'B', 'D'])
    expect(result.rows.map(row => row.qualSeniority)).toEqual([null, 1, 2])
  })

  it('highlights the real row when inserting yourself into your own qual', () => {
    const result = projectQualViewer({ entries, qual: { base: 'BOS', fleet: '220', seat: 'CA' }, employeeNumber: 'B', insertSelf: true, asOfDate: '2026-06-16' })
    expect(result.rows.filter(row => row.employeeNumber === 'B')).toHaveLength(1)
    expect(result.rows.find(row => row.employeeNumber === 'B')).toMatchObject({ isUser: true, isMarker: false })
  })

  it('preserves the actual user row when insertion is deselected on the user qual', () => {
    const options = { entries, qual: { base: 'BOS', fleet: '220', seat: 'CA' }, employeeNumber: '00123', asOfDate: '2026-06-16' }
    const paddedEntries = entries.map((entry, index) => index === 1 ? { ...entry, employee_number: '00123' } : entry)

    for (const insertSelf of [true, false]) {
      const result = projectQualViewer({ ...options, entries: paddedEntries, insertSelf })
      expect(result.rows.find(row => row.employeeNumber === '00123')).toMatchObject({ isUser: true, isMarker: false })
    }
  })

  it('inserts a marker into another qual and shifts affected active ranks', () => {
    const result = projectQualViewer({ entries, qual: { base: 'JFK', fleet: '737', seat: 'FO' }, employeeNumber: 'B', insertSelf: true, asOfDate: '2026-06-16' })
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({ employeeNumber: 'B', status: 'inserted', isMarker: true, qualSeniority: 1, qualPercentile: 100 })
    expect(result.rows[1]).toMatchObject({ employeeNumber: 'C', qualSeniority: 2, qualPercentile: 50 })
  })

  it('places the marker between matching pilots at the employee company seniority position', () => {
    const middleEntries = [
      makeDomainEntry({ seniority_number: 10, employee_number: 'Q1', base: 'JFK', fleet: '737', seat: 'FO', retire_date: '2040-01-01' }),
      makeDomainEntry({ seniority_number: 20, employee_number: 'Q2', base: 'JFK', fleet: '737', seat: 'FO', retire_date: '2040-01-01' }),
      makeDomainEntry({ seniority_number: 30, employee_number: 'USER', base: 'BOS', fleet: '220', seat: 'CA', retire_date: '2040-01-01' }),
      makeDomainEntry({ seniority_number: 40, employee_number: 'Q3', base: 'JFK', fleet: '737', seat: 'FO', retire_date: '2040-01-01' }),
    ]
    const result = projectQualViewer({ entries: middleEntries, qual: { base: 'JFK', fleet: '737', seat: 'FO' }, employeeNumber: 'USER', insertSelf: true, asOfDate: '2026-06-15' })
    expect(result.rows.map(row => row.employeeNumber)).toEqual(['Q1', 'Q2', 'USER', 'Q3'])
    expect(result.rows[2]).toMatchObject({ isMarker: true, status: 'inserted', qualSeniority: 3 })
  })

  it('keeps a retired inserted employee visible without current ranks', () => {
    const result = projectQualViewer({ entries, qual: { base: 'JFK', fleet: '737', seat: 'FO' }, employeeNumber: 'A', insertSelf: true, asOfDate: '2026-06-15' })
    expect(result.rows[0]).toMatchObject({ status: 'retired', companySeniority: null, companyPercentile: null, qualSeniority: null })
  })

  it('does not allow insertion when the employee is absent', () => {
    const result = projectQualViewer({ entries, qual: { base: 'JFK', fleet: '737', seat: 'FO' }, employeeNumber: 'missing', insertSelf: true, asOfDate: '2026-06-15' })
    expect(result.canInsert).toBe(false)
    expect(result.rows).toHaveLength(1)
  })
})
