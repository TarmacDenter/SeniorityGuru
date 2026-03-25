// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { jetblueParser, normalizeSlashDate } from './jetblue'

describe('normalizeSlashDate', () => {
  it('converts M/D/YYYY to YYYY-MM-DD', () => {
    expect(normalizeSlashDate('3/5/2030')).toBe('2030-03-05')
  })

  it('converts MM/DD/YYYY to YYYY-MM-DD', () => {
    expect(normalizeSlashDate('11/15/2028')).toBe('2028-11-15')
  })

  it('handles single-digit month and day', () => {
    expect(normalizeSlashDate('1/9/2045')).toBe('2045-01-09')
  })

  it('passes through unrecognized formats unchanged', () => {
    expect(normalizeSlashDate('2030-03-05')).toBe('2030-03-05')
  })
})

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
})
