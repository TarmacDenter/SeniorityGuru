import { describe, it, expect } from 'vitest'
import { presentDiffRows } from './diff-row-presentation'
import type { DiffRow } from './build-diff-rows'

const qualMove: DiffRow = { kind: 'qualMove', seniority_number: 150, employee_number: '10003', name: 'R. Chen', old_seat: 'FO', new_seat: 'CA', old_fleet: '737', new_fleet: '777', old_base: 'JFK', new_base: 'JFK', hire_date: '2010-01-01', retire_date: '2040-01-01' }
const snc: DiffRow = { kind: 'seniorityNumberChange', seniority_number: 488, employee_number: '10005', name: undefined, old_seniority_number: 500, delta: 12, seat: 'CA', fleet: '777', base: 'DFW', hire_date: '2005-01-01', retire_date: '2045-01-01' }

describe('presentDiffRows', () => {
  it('shows Qualification as Base, Seat, Fleet using the current values', () => {
    const [row] = presentDiffRows([qualMove], { showSeniorityNumberChanges: false })
    expect(row!.qualification).toBe('JFK CA 777')
    expect(row!.change).toBe('FO→CA / 737→777')
  })

  it('hides Seniority Number changes unless asked, and falls back to the employee number', () => {
    expect(presentDiffRows([snc], { showSeniorityNumberChanges: false })).toEqual([])
    const [row] = presentDiffRows([snc], { showSeniorityNumberChanges: true })
    expect(row!.name).toBe('10005')
    expect(row!.change).toBe('Seniority Number +12')
  })

  it('marks the user line', () => {
    const [row] = presentDiffRows([qualMove], { showSeniorityNumberChanges: false, userEmployeeNumber: '10003' })
    expect(row!.isAnchor).toBe(true)
  })
})
