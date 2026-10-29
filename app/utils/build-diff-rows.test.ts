// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildDiffRows } from './build-diff-rows'
import type { CompareResult } from './seniority-compare'

const emptyResult: CompareResult = {
  retired: [],
  departed: [],
  qualMoves: [],
  seniorityNumberChanges: [],
  newHires: [],
}

function makeRetired(overrides: { employee_number: string; seniority_number: number; retire_date?: string }) {
  return {
    employee_number: overrides.employee_number,
    name: 'Test Pilot',
    seniority_number: overrides.seniority_number,
    retire_date: overrides.retire_date ?? '2026-01-01',
    seat: 'CA',
    fleet: '737',
    base: 'JFK',
    hire_date: '2000-01-01',
  }
}

function makeDeparted(overrides: { employee_number: string; seniority_number: number }) {
  return {
    employee_number: overrides.employee_number,
    name: 'Test Pilot',
    seniority_number: overrides.seniority_number,
    retire_date: '2035-01-01',
    seat: 'FO',
    fleet: '737',
    base: 'ORD',
    hire_date: '2015-01-01',
  }
}

function makeQualMove(overrides: { employee_number: string; seniority_number: number }) {
  return {
    employee_number: overrides.employee_number,
    name: 'Test Pilot',
    seniority_number: overrides.seniority_number,
    old_seat: 'FO', new_seat: 'CA',
    old_fleet: '737', new_fleet: '777',
    old_base: 'JFK', new_base: 'ORD',
    hire_date: '2010-01-01',
    retire_date: '2040-01-01',
  }
}

function makeSeniorityNumberChange(overrides: { employee_number: string; old_seniority_number: number; new_seniority_number: number }) {
  return {
    employee_number: overrides.employee_number,
    name: 'Test Pilot',
    old_seniority_number: overrides.old_seniority_number,
    new_seniority_number: overrides.new_seniority_number,
    delta: overrides.old_seniority_number - overrides.new_seniority_number,
    seat: 'CA',
    fleet: '777',
    base: 'DFW',
    hire_date: '2005-01-01',
    retire_date: '2045-01-01',
  }
}

function makeNewHire(overrides: { employee_number: string; seniority_number: number }) {
  return {
    employee_number: overrides.employee_number,
    name: 'New Pilot',
    seniority_number: overrides.seniority_number,
    hire_date: '2026-01-15',
    seat: 'FO',
    fleet: 'E175',
    base: 'DEN',
    retire_date: '2061-01-01',
  }
}

describe('buildDiffRows', () => {
  it('returns empty array for empty CompareResult', () => {
    const rows = buildDiffRows(emptyResult, { includeSeniorityNumberChanges: false })
    expect(rows).toEqual([])
  })

  it('returns a retired row with kind "retired" at the old seniority number', () => {
    const result: CompareResult = {
      ...emptyResult,
      retired: [makeRetired({ employee_number: '100', seniority_number: 412 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: false })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'retired', seniority_number: 412, employee_number: '100' })
  })

  it('returns a departed row with kind "departed" at the old seniority number', () => {
    const result: CompareResult = {
      ...emptyResult,
      departed: [makeDeparted({ employee_number: '200', seniority_number: 300 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: false })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'departed', seniority_number: 300, employee_number: '200' })
  })

  it('returns a qualMove row with kind "qualMove" at the new seniority number', () => {
    const result: CompareResult = {
      ...emptyResult,
      qualMoves: [makeQualMove({ employee_number: '300', seniority_number: 150 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: false })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'qualMove', seniority_number: 150, employee_number: '300' })
  })

  it('excludes Seniority Number changes when includeSeniorityNumberChanges is false', () => {
    const result: CompareResult = {
      ...emptyResult,
      seniorityNumberChanges: [makeSeniorityNumberChange({ employee_number: '400', old_seniority_number: 500, new_seniority_number: 488 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: false })
    expect(rows).toHaveLength(0)
  })

  it('includes Seniority Number changes with kind "seniorityNumberChange" at the new seniority number when includeSeniorityNumberChanges is true', () => {
    const result: CompareResult = {
      ...emptyResult,
      seniorityNumberChanges: [makeSeniorityNumberChange({ employee_number: '400', old_seniority_number: 500, new_seniority_number: 488 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: true })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'seniorityNumberChange', seniority_number: 488, employee_number: '400' })
  })

  it('returns a newHire row with kind "newHire" at the new seniority number', () => {
    const result: CompareResult = {
      ...emptyResult,
      newHires: [makeNewHire({ employee_number: '500', seniority_number: 2000 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: false })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'newHire', seniority_number: 2000, employee_number: '500' })
  })

  it('sorts all rows ascending by seniority_number', () => {
    const result: CompareResult = {
      retired: [makeRetired({ employee_number: '100', seniority_number: 500 })],
      departed: [makeDeparted({ employee_number: '200', seniority_number: 200 })],
      qualMoves: [makeQualMove({ employee_number: '300', seniority_number: 350 })],
      seniorityNumberChanges: [],
      newHires: [makeNewHire({ employee_number: '400', seniority_number: 1800 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: false })
    const numbers = rows.map(r => r.seniority_number)
    expect(numbers).toEqual([200, 350, 500, 1800])
  })

  it('sorts mixed gapped rows using the newer assigned number for Seniority Number changes', () => {
    const result: CompareResult = {
      retired: [makeRetired({ employee_number: '100', seniority_number: 40 })],
      departed: [makeDeparted({ employee_number: '200', seniority_number: 120 })],
      qualMoves: [makeQualMove({ employee_number: '300', seniority_number: 150 })],
      seniorityNumberChanges: [
        makeSeniorityNumberChange({ employee_number: '400', old_seniority_number: 10, new_seniority_number: 210 }),
        makeSeniorityNumberChange({ employee_number: '500', old_seniority_number: 300, new_seniority_number: 30 }),
      ],
      newHires: [makeNewHire({ employee_number: '600', seniority_number: 350 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: true })
    expect(rows.map(row => row.seniority_number)).toEqual([30, 40, 120, 150, 210, 350])
    expect(rows[0]).toMatchObject({ kind: 'seniorityNumberChange', old_seniority_number: 300, delta: 270 })
    expect(rows[4]).toMatchObject({ kind: 'seniorityNumberChange', old_seniority_number: 10, delta: -200 })
  })

  it('places deleted rows before the new occupant when they share the same seniority number', () => {
    const result: CompareResult = {
      ...emptyResult,
      retired: [makeRetired({ employee_number: '100', seniority_number: 412 })],
      seniorityNumberChanges: [makeSeniorityNumberChange({ employee_number: '101', old_seniority_number: 413, new_seniority_number: 412 })],
    }
    const rows = buildDiffRows(result, { includeSeniorityNumberChanges: true })
    const atSameNumber = rows.filter(r => r.seniority_number === 412)
    expect(atSameNumber).toHaveLength(2)
    expect(atSameNumber[0]!.kind).toBe('retired')
    expect(atSameNumber[1]!.kind).toBe('seniorityNumberChange')
  })
})
