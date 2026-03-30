// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parseDemoCSV, DEMO_EMPLOYEE_NUMBER } from './demo-parser'

const FIXTURE_CSV = `SEN,CMID,NAME,BASE,FLEET,SEAT,HIREDATE,RTRDATE
1,1841,"TILLMAN, Joan",BOS,320,CA,7/16/1999,11/1/2059
2,3726,"WATERS, Ollie",JFK,320,CA,8/6/1999,1/19/2062
95,1034,"SMITHAM, Sabrina",JFK,320,FO,4/25/2001,3/20/2041`

describe('parseDemoCSV', () => {
  it('returns one entry per data row (excluding header)', () => {
    const entries = parseDemoCSV(FIXTURE_CSV)
    expect(entries).toHaveLength(3)
  })

  it('maps CSV columns to LocalSeniorityEntry fields', () => {
    const [first] = parseDemoCSV(FIXTURE_CSV)
    expect(first).toMatchObject({
      seniorityNumber: 1,
      employeeNumber: '1841',
      name: 'TILLMAN, Joan',
      base: 'BOS',
      fleet: '320',
      seat: 'CA',
    })
  })

  it('converts M/D/YYYY hire date to ISO format', () => {
    const [first] = parseDemoCSV(FIXTURE_CSV)
    expect(first!.hireDate).toBe('1999-07-16')
  })

  it('converts M/D/YYYY retire date to ISO format', () => {
    const [first] = parseDemoCSV(FIXTURE_CSV)
    expect(first!.retireDate).toBe('2059-11-01')
  })

  it('strips surrounding quotes from quoted name field', () => {
    const [first] = parseDemoCSV(FIXTURE_CSV)
    expect(first!.name).toBe('TILLMAN, Joan')
    expect(first!.name).not.toMatch(/^"/)
  })

  it('parses all 2999 rows from the real demo CSV', async () => {
    const { readFile } = await import('node:fs/promises')
    const csv = await readFile(new URL('../../demo/demo-data.csv', import.meta.url), 'utf-8')
    const entries = parseDemoCSV(csv)
    expect(entries).toHaveLength(3000)
  })
})

describe('DEMO_EMPLOYEE_NUMBER', () => {
  it('is a string matching a mid-list FO (~rank 2000) in the base data', () => {
    expect(typeof DEMO_EMPLOYEE_NUMBER).toBe('string')
    expect(DEMO_EMPLOYEE_NUMBER).toBe('1371')
  })
})
