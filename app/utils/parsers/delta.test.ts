// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { decomposeCategory, mapSeatCode, deltaParser } from './delta'

describe('mapSeatCode', () => {
  it('maps A to CA (Captain)', () => {
    expect(mapSeatCode('A')).toBe('CA')
  })

  it('maps B to FO (First Officer)', () => {
    expect(mapSeatCode('B')).toBe('FO')
  })

  it('passes through unknown codes', () => {
    expect(mapSeatCode('X')).toBe('X')
  })
})

describe('decomposeCategory', () => {
  it('splits a normal 7-char category into base, fleet, seat', () => {
    expect(decomposeCategory('XYZ350A')).toEqual({ base: 'XYZ', fleet: '350', seat: 'CA' })
  })

  it('handles NBC status categories', () => {
    expect(decomposeCategory('NBCMILB')).toEqual({ base: 'NBC', fleet: 'MIL', seat: 'FO' })
  })

  it('handles INS instructor categories', () => {
    expect(decomposeCategory('INS320A')).toEqual({ base: 'INS', fleet: '320', seat: 'CA' })
  })

  it('handles SUP supervisor categories', () => {
    expect(decomposeCategory('SUP7ERA')).toEqual({ base: 'SUP', fleet: '7ER', seat: 'CA' })
  })

  it('defaults empty string to NBCNEWB', () => {
    expect(decomposeCategory('')).toEqual({ base: 'NBC', fleet: 'NEW', seat: 'FO' })
  })

  it('defaults whitespace-only to NBCNEWB', () => {
    expect(decomposeCategory('   ')).toEqual({ base: 'NBC', fleet: 'NEW', seat: 'FO' })
  })
})

describe('deltaParser.parse — header detection', () => {
  it('finds header row with 0 preamble rows', () => {
    const raw = [
      ['SENIORITY_NBR', 'Emp_Nbr', 'Name', 'Category', 'Pilot_Hire_Date', 'Scheduled_Retire_Date'],
      ['1', '900001', 'MCFLYGUY, MARTY J', 'XYZ350A', '15Jan2099', '15Jan2164'],
    ]
    const result = deltaParser.parse(raw)
    expect(result.rows.length).toBe(2) // header + 1 data row
    expect(result.rows[0]).toContain('Seniority Number')
  })

  it('finds header row with 2 preamble rows', () => {
    const raw = [
      ['Seniority List 01MAR2099', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['SENIORITY_NBR', 'Emp_Nbr', 'Name', 'Category', 'Pilot_Hire_Date', 'Scheduled_Retire_Date'],
      ['1', '900001', 'SKYWALKER, LUKE A', 'XYZ73NA', '15Jan2099', '15Jan2164'],
    ]
    const result = deltaParser.parse(raw)
    expect(result.rows.length).toBe(2)
    expect(result.rows[0]).toContain('Seniority Number')
  })
})

describe('deltaParser.parse — metadata extraction', () => {
  it('extracts effective date from preamble title', () => {
    const raw = [
      ['Seniority List 01MAR2099', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['SENIORITY_NBR', 'Emp_Nbr', 'Name', 'Category', 'Pilot_Hire_Date', 'Scheduled_Retire_Date'],
      ['1', '900001', 'WEASLEY, RON B', 'XYZ350A', '15Jan2099', '15Jan2164'],
    ]
    const result = deltaParser.parse(raw)
    expect(result.metadata.effectiveDate).toBe('2099-03-01')
    expect(result.metadata.title).toBe('Seniority List 01MAR2099')
  })

  it('returns null metadata when no preamble', () => {
    const raw = [
      ['SENIORITY_NBR', 'Emp_Nbr', 'Name', 'Category', 'Pilot_Hire_Date', 'Scheduled_Retire_Date'],
      ['1', '900001', 'BANANAMAN, CARL Z', 'XYZ350A', '15Jan2099', '15Jan2164'],
    ]
    const result = deltaParser.parse(raw)
    expect(result.metadata.effectiveDate).toBeNull()
    expect(result.metadata.title).toBeNull()
  })
})

describe('deltaParser.parse — full integration', () => {
  const fixture = [
    ['Seniority List 01MAR2099', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['SENIORITY_NBR', 'Emp_Nbr', 'Name', 'Category', 'Pilot_Hire_Date', 'Scheduled_Retire_Date'],
    ['1', '900001', 'MCFLYGUY, MARTY J', 'ATL350A', '15Jan2099', '15Jan2164'],
    ['2', '900002', 'SKYWALKER, LUKE A', 'NBCMILB', '20Feb2099', '20Feb2164'],
    ['3', '900003', 'WEASLEY, RON B', 'INS320A', '01Mar2099', '01Mar2164'],
    ['4', '900004', 'BANANAMAN, CARL Z', '', '10Apr2099', '10Apr2164'],
    ['5', '900005', 'PICARD, JEAN-LUC T', 'SUP7ERA', '05May2099', '05May2164'],
  ]

  it('outputs standard headers in correct order', () => {
    const result = deltaParser.parse(fixture)
    const headers = result.rows[0]!
    expect(headers).toContain('Seniority Number')
    expect(headers).toContain('Employee Number')
    expect(headers).toContain('Name')
    expect(headers).toContain('Hire Date')
    expect(headers).toContain('Retire Date')
    expect(headers).toContain('Base')
    expect(headers).toContain('Fleet')
    expect(headers).toContain('Seat')
    expect(headers).not.toContain('Category')
  })

  it('decomposes normal category correctly', () => {
    const result = deltaParser.parse(fixture)
    const row = result.rows[1]!
    const headers = result.rows[0]!
    const baseIdx = headers.indexOf('Base')
    const fleetIdx = headers.indexOf('Fleet')
    const seatIdx = headers.indexOf('Seat')
    expect(row[baseIdx]).toBe('ATL')
    expect(row[fleetIdx]).toBe('350')
    expect(row[seatIdx]).toBe('CA')
  })

  it('handles empty category rows as NBCNEWB', () => {
    const result = deltaParser.parse(fixture)
    const headers = result.rows[0]!
    const baseIdx = headers.indexOf('Base')
    const fleetIdx = headers.indexOf('Fleet')
    const seatIdx = headers.indexOf('Seat')
    // Row 4 (index 4 in result.rows) has empty category
    const row = result.rows[4]!
    expect(row[baseIdx]).toBe('NBC')
    expect(row[fleetIdx]).toBe('NEW')
    expect(row[seatIdx]).toBe('FO')
  })

  it('preserves all 5 data rows', () => {
    const result = deltaParser.parse(fixture)
    expect(result.rows.length).toBe(6) // 1 header + 5 data
  })

  it('falls back gracefully when no Delta headers found', () => {
    const generic = [
      ['Col A', 'Col B'],
      ['1', '2'],
    ]
    const result = deltaParser.parse(generic)
    expect(result.rows).toBe(generic) // pass-through
    expect(result.metadata.effectiveDate).toBeNull()
  })

  it('filters out blank trailing rows', () => {
    const withBlanks = [
      ...fixture,
      ['', '', '', '', '', ''],
      ['', '', '', '', '', ''],
    ]
    const result = deltaParser.parse(withBlanks)
    expect(result.rows.length).toBe(6) // header + 5 data, no blanks
  })
})
