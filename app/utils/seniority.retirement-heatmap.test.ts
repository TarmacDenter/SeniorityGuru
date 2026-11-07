// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { Temporal } from '~/utils/temporal'
import { createSeniorityAnalysis } from './seniority'

const asOfDate = Temporal.PlainDate.from('2026-06-15')
const entries = [
  makeEntry({ seniority_number: 1, employee_number: '1', base: 'JFK', seat: 'CA', retire_date: '2027-01-01' }),
  makeEntry({ seniority_number: 2, employee_number: '2', base: 'JFK', seat: 'CA', retire_date: '2027-05-01' }),
  makeEntry({ seniority_number: 3, employee_number: '3', base: 'JFK', seat: 'FO', retire_date: '2040-01-01' }),
  makeEntry({ seniority_number: 4, employee_number: '4', base: 'JFK', seat: 'FO', retire_date: undefined }),
  makeEntry({ seniority_number: 5, employee_number: '5', base: 'LAX', seat: 'CA', retire_date: '2027-01-01' }),
]

describe('public Retirement Heatmap', () => {
  const analysis = createSeniorityAnalysis({ entries, asOfDate })

  it('labels rows by group, busiest first, with counts, shares and shading', () => {
    const { presentation } = analysis.retirementHeatmap({ groupBy: ['base'] })
    expect(presentation.yearLabels[0]).toBe('2026')
    expect(presentation.rows.map(row => [row.label, row.totalLabel, row.activePilotCountLabel])).toEqual([
      ['JFK', '3 retirements', '4 active pilots'],
      ['LAX', '1 retirement', '1 active pilot'],
    ])
    const jfk2027 = presentation.rows[0]!.cells.find(cell => cell.year === 2027)!
    expect(jfk2027).toMatchObject({ retirementCount: 2, countLabel: '2', percentLabel: '50.0%', countIntensity: 1, percentIntensity: 0.5 })
    expect(jfk2027.description).toBe('JFK · 2027 · 2 retirements (50.0% of 4 active pilots)')
    const lax2027 = presentation.rows[1]!.cells.find(cell => cell.year === 2027)!
    expect(lax2027).toMatchObject({ percentLabel: '100.0%', countIntensity: 0.5, percentIntensity: 1 })
    expect(presentation.undatedPilotNote).toBe('1 active pilot has no retirement date and is not shown.')
    expect(presentation.isEmpty).toBe(false)
  })

  it('filters by the Scenario Qualification Scope and names an ungrouped row after it', () => {
    const { presentation } = analysis.retirementHeatmap({ groupBy: [], scenario: { qualificationScope: { base: 'JFK', seat: 'CA' } } })
    expect(presentation.rows.map(row => [row.label, row.totalLabel])).toEqual([['JFK CA', '2 retirements']])
    expect(presentation.undatedPilotNote).toBeNull()
  })

  it('combines dimensions into one row per Qualification group', () => {
    const { presentation } = analysis.retirementHeatmap({ groupBy: ['base', 'seat'] })
    expect(presentation.rows.map(row => row.label)).toEqual(['JFK CA', 'JFK FO', 'LAX CA'])
  })
  it('sorts within the shown years and labels the axis with the sort figure', () => {
    const { presentation } = analysis.retirementHeatmap({ groupBy: ['base'], years: 2, sortBy: 'percent' })
    expect(presentation.yearLabels).toEqual(['2026', '2027'])
    expect(presentation.yearRangeLabel).toBe('2026\u20132027')
    expect(presentation.availableYearCount).toBe(15)
    expect(presentation.rows.map(row => [row.axisLabel, row.totalLabel, row.totalPercentLabel])).toEqual([
      ['LAX · 100.0%', '1 retirement', '100.0%'],
      ['JFK · 50.0%', '2 retirements', '50.0%'],
    ])
  })
})
