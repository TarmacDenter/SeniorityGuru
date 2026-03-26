// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { jetblueParser } from './jetblue'

describe('jetblueParser.parse', () => {
  const sampleFile: string[][] = [
    ['SEN', 'CMID', 'NAME', 'BASE', 'FLEET', 'SEAT', 'HIREDATE', 'RTRDATE', 'YRS2RTR'],
    ['1', '50001', 'JANE SMITH', 'BOS', '320', 'CA', '3/15/2005', '6/1/2040', '14.2'],
    ['2', '50002', 'BOB JONES JR', 'JFK', '220', 'FO', '11/8/2010', '9/30/2045', '19.5'],
    ['3', '50003', 'ALICE WALKER', 'MCO', '320', 'CA', '1/7/2015', '3/22/2050', '24.1'],
  ]

  it('produces standard headers', () => {
    const { rows } = jetblueParser.parse(sampleFile)
    const headers = rows[0]!
    expect(headers).toContain('Seniority Number')
    expect(headers).toContain('Employee Number')
    expect(headers).toContain('Name')
    expect(headers).toContain('Base')
    expect(headers).toContain('Fleet')
    expect(headers).toContain('Seat')
    expect(headers).toContain('Hire Date')
    expect(headers).toContain('Retire Date')
  })

  it('drops the YRS2RTR column', () => {
    const { rows } = jetblueParser.parse(sampleFile)
    const headers = rows[0]!
    expect(headers).not.toContain('YRS2RTR')
    // Data rows should also have one fewer column than the original
    expect(rows[1]!.length).toBe(8)
  })

  it('normalizes dates to YYYY-MM-DD', () => {
    const { rows } = jetblueParser.parse(sampleFile)
    const headers = rows[0]!
    const firstRow = rows[1]!
    const hireIdx = headers.indexOf('Hire Date')
    const retireIdx = headers.indexOf('Retire Date')

    expect(firstRow[hireIdx]).toBe('2005-03-15')
    expect(firstRow[retireIdx]).toBe('2040-06-01')
  })

  it('preserves all data rows', () => {
    const { rows } = jetblueParser.parse(sampleFile)
    // 1 header + 3 data rows
    expect(rows).toHaveLength(4)
  })

  it('preserves base, fleet, seat values', () => {
    const { rows } = jetblueParser.parse(sampleFile)
    const headers = rows[0]!
    const firstRow = rows[1]!
    expect(firstRow[headers.indexOf('Base')]).toBe('BOS')
    expect(firstRow[headers.indexOf('Fleet')]).toBe('320')
    expect(firstRow[headers.indexOf('Seat')]).toBe('CA')
  })

  it('skips blank rows', () => {
    const withBlanks = [
      ...sampleFile,
      ['', '', '', '', '', '', '', '', ''],
    ]
    const { rows } = jetblueParser.parse(withBlanks)
    expect(rows).toHaveLength(4)
  })

  it('returns null metadata (no preamble)', () => {
    const { metadata } = jetblueParser.parse(sampleFile)
    expect(metadata.effectiveDate).toBeNull()
    expect(metadata.title).toBeNull()
  })

  it('falls back gracefully when header is not found', () => {
    const noHeader = [['random', 'data', 'here']]
    const { rows, metadata } = jetblueParser.parse(noHeader)
    expect(rows).toEqual(noHeader)
    expect(metadata.effectiveDate).toBeNull()
  })

  it('handles renamed header aliases', () => {
    const altHeaders: string[][] = [
      ['SENIORITY', 'CMID', 'NAME', 'BASE', 'FLEET', 'SEAT', 'HIRE_DATE', 'RTR_DATE', 'YRS2RTR'],
      ['1', '50001', 'JANE SMITH', 'BOS', '320', 'CA', '3/15/2005', '6/1/2040', '14.2'],
    ]
    const { rows } = jetblueParser.parse(altHeaders)
    expect(rows[0]).toContain('Seniority Number')
    expect(rows[0]).toContain('Hire Date')
    expect(rows[0]).toContain('Retire Date')
  })

  it('normalizes mixed date formats via per-cell fallback', () => {
    const mixed: string[][] = [
      ['SEN', 'CMID', 'NAME', 'BASE', 'FLEET', 'SEAT', 'HIREDATE', 'RTRDATE'],
      ['1', '50001', 'JANE SMITH', 'BOS', '320', 'CA', '3/15/2005', '2040-06-01'],
      ['2', '50002', 'BOB JONES', 'JFK', '220', 'FO', '2010-11-08', '9/30/2045'],
    ]
    const { rows } = jetblueParser.parse(mixed)
    const headers = rows[0]!
    const hireIdx = headers.indexOf('Hire Date')
    const retireIdx = headers.indexOf('Retire Date')

    expect(rows[1]![hireIdx]).toBe('2005-03-15')
    expect(rows[1]![retireIdx]).toBe('2040-06-01')
    expect(rows[2]![hireIdx]).toBe('2010-11-08')
    expect(rows[2]![retireIdx]).toBe('2045-09-30')
  })

  it('normalizes 2-digit year dates', () => {
    const twoDigitYears: string[][] = [
      ['SEN', 'CMID', 'NAME', 'BASE', 'FLEET', 'SEAT', 'HIREDATE', 'RTRDATE'],
      ['1', '50001', 'JANE SMITH', 'BOS', '320', 'CA', '3/15/05', '6/1/40'],
      ['2', '50002', 'BOB JONES', 'JFK', '220', 'FO', '11/8/10', '9/30/45'],
    ]
    const { rows } = jetblueParser.parse(twoDigitYears)
    const headers = rows[0]!
    const hireIdx = headers.indexOf('Hire Date')
    const retireIdx = headers.indexOf('Retire Date')

    expect(rows[1]![hireIdx]).toBe('2005-03-15')
    expect(rows[1]![retireIdx]).toBe('2040-06-01')
    expect(rows[2]![hireIdx]).toBe('2010-11-08')
    expect(rows[2]![retireIdx]).toBe('2045-09-30')
  })

  it('maps 2-digit retire years > 50 to 20xx (pilots retiring in 2050s–2070s)', () => {
    // Junior pilots retiring in 2055–2065 have 2-digit years > 50.
    // The standard century pivot (>50 → 19xx) would produce 1955–1965 — this test
    // ensures the future-biased parser correctly maps them to 2055–2065.
    const futureRetires: string[][] = [
      ['SEN', 'CMID', 'NAME', 'BASE', 'FLEET', 'SEAT', 'HIREDATE', 'RTRDATE'],
      ['3819', '53819', 'PILOT A', 'JFK', '320', 'FO', '8/15/2022', '6/13/55'],
      ['3820', '53820', 'PILOT B', 'BOS', '220', 'FO', '3/1/2023',  '9/6/62'],
      ['3821', '53821', 'PILOT C', 'MCO', '320', 'FO', '11/7/2021', '3/15/65'],
    ]
    const { rows } = jetblueParser.parse(futureRetires)
    const headers = rows[0]!
    const retireIdx = headers.indexOf('Retire Date')

    expect(rows[1]![retireIdx]).toBe('2055-06-13')
    expect(rows[2]![retireIdx]).toBe('2062-09-06')
    expect(rows[3]![retireIdx]).toBe('2065-03-15')
  })
})
