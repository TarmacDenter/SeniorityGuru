// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  parseSpreadsheetData,
  autoDetectColumnMap,
  applyColumnMap,
  isColumnMapComplete,
  type ColumnMap,
} from './parse-spreadsheet'

describe('parseSpreadsheetData', () => {
  it('splits raw sheet data into headers and rows', () => {
    const raw = [
      ['Sen #', 'EmpID', 'Seat'],
      ['1', '00123', 'CA'],
      ['2', '00456', 'FO'],
    ]
    const result = parseSpreadsheetData(raw)
    expect(result.headers).toEqual(['Sen #', 'EmpID', 'Seat'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual(['1', '00123', 'CA'])
  })

  it('returns empty rows for single-row input', () => {
    const raw = [['Header1', 'Header2']]
    const result = parseSpreadsheetData(raw)
    expect(result.headers).toEqual(['Header1', 'Header2'])
    expect(result.rows).toEqual([])
  })
})

describe('autoDetectColumnMap', () => {
  it('detects common seniority number aliases', () => {
    const map = autoDetectColumnMap(['Sen #', 'Employee ID', 'Position', 'Domicile', 'Equipment', 'Full Name'])
    expect(map.seniority_number).toBe(0)
    expect(map.employee_number).toBe(1)
    expect(map.seat).toBe(2)
    expect(map.base).toBe(3)
    expect(map.fleet).toBe(4)
    expect(map.name).toBe(5)
  })

  it('returns -1 for unmatched fields', () => {
    const map = autoDetectColumnMap(['Col A', 'Col B'])
    expect(map.seniority_number).toBe(-1)
    expect(map.employee_number).toBe(-1)
  })
})

describe('applyColumnMap', () => {
  const map: ColumnMap = {
    seniority_number: 0,
    employee_number: 1,
    seat: 2,
    base: 3,
    fleet: 4,
    name: -1,
    hire_date: 5,
    retire_date: -1,
  }

  it('maps raw rows to typed entries', () => {
    const rows = [
      ['1', '00123', 'CA', 'JFK', '737', '2010-01-15'],
      ['2', '456', 'FO', 'LAX', '320', '2015-06-01'],
    ]
    const entries = applyColumnMap(rows, map, {})
    expect(entries).toHaveLength(2)
    expect(entries[0]!.seniority_number).toBe(1)
    expect(entries[0]!.employee_number).toBe('123')  // normalized
    expect(entries[0]!.seat).toBe('CA')
    expect(entries[0]!.base).toBe('JFK')
    expect(entries[0]!.fleet).toBe('737')
    expect(entries[0]!.hire_date).toBe('2010-01-15')
    expect(entries[0]!.name).toBeUndefined()
  })

  it('normalizes dates from MM/DD/YYYY to YYYY-MM-DD', () => {
    const rows = [['1', '123', 'CA', 'JFK', '737', '01/15/2010']]
    const entries = applyColumnMap(rows, map, {})
    expect(entries[0]!.hire_date).toBe('2010-01-15')
  })

  it('merges separate first/last name columns', () => {
    const nameRows = [['1', '123', 'CA', 'JFK', '737', '2010-01-15', 'Smith', 'John']]
    const nameMap: ColumnMap = { ...map, name: -1 }
    const entries = applyColumnMap(nameRows, nameMap, {
      nameMode: 'separate',
      firstNameCol: 7,
      lastNameCol: 6,
    })
    expect(entries[0]!.name).toBe('Smith, John')
  })

  it('computes retire_date from DOB column when retireMode is dob', () => {
    const dobRows = [['1', '123', 'CA', 'JFK', '737', '2010-01-15', '1970-06-15']]
    const dobMap: ColumnMap = { ...map, retire_date: -1 }
    const entries = applyColumnMap(dobRows, dobMap, {
      retireMode: 'dob',
      dobCol: 6,
      retirementAge: 65,
    })
    expect(entries[0]!.retire_date).toBe('2035-06-15')
  })
})

describe('isColumnMapComplete', () => {
  it('returns true when all required columns are mapped', () => {
    const map: ColumnMap = {
      seniority_number: 0, employee_number: 1, seat: 2,
      base: 3, fleet: 4, name: 5, hire_date: 6, retire_date: 7,
    }
    expect(isColumnMapComplete(map)).toBe(true)
  })

  it('returns true when name is unmapped (optional)', () => {
    const map: ColumnMap = {
      seniority_number: 0, employee_number: 1, seat: 2,
      base: 3, fleet: 4, name: -1, hire_date: 6, retire_date: 7,
    }
    expect(isColumnMapComplete(map)).toBe(true)
  })

  it('returns false when a required column is unmapped', () => {
    const map: ColumnMap = {
      seniority_number: 0, employee_number: 1, seat: -1,
      base: 3, fleet: 4, name: 5, hire_date: 6, retire_date: 7,
    }
    expect(isColumnMapComplete(map)).toBe(false)
  })

  it('returns false when hire_date is unmapped', () => {
    const map: ColumnMap = {
      seniority_number: 0, employee_number: 1, seat: 2,
      base: 3, fleet: 4, name: 5, hire_date: -1, retire_date: 7,
    }
    expect(isColumnMapComplete(map)).toBe(false)
  })
})
