import { describe, expect, it } from 'vitest'
import { deltaImportPlugin, decomposeDeltaCategory } from './delta'
import { prepareImport } from '../prepare-import'

const sourceSheet = {
  id: 'sheet:0', name: 'Delta',
  columns: ['a', 'b', 'c', 'd', 'e', 'f'].map((label, index) => ({ id: `source:column:${index}`, label })),
  rows: [
    { id: 'source:row:0', cells: ['Seniority List 01MAR2099', null, null, null, null, null] },
    { id: 'source:row:1', cells: ['SENIORITY_NBR', 'Emp_Nbr', 'Category', 'Pilot_Hire_Date', 'Scheduled_Retire_Date', 'Name'] },
    { id: 'source:row:2', cells: ['1', '900001', 'ATL350A', '15Jan2099', '.', 'Marty'] },
  ],
} as const

describe('deltaImportPlugin', () => {
  it('finds its header and exposes derived Category values without replacing source values', () => {
    expect(deltaImportPlugin.suggestHeaderRow?.(sourceSheet)).toBe(1)
    const result = prepareImport({ plugin: deltaImportPlugin, sourceSheet, headerRowIndex: 1 })
    expect(result.mappingSuggestions).toMatchObject({ base: 'plugin:delta:base', fleet: 'plugin:delta:fleet', seat: 'plugin:delta:seat' })
    expect(result.preparedSheet.rows[2]!.cells['plugin:delta:base']).toBe('ATL')
    expect(result.preparedSheet.rows[2]!.cells['source:column:2']).toBe('ATL350A')
    expect(result.metadata).toEqual({ effectiveDate: '2099-03-01', title: 'Seniority List 01MAR2099' })
  })

  it('keeps Delta category fallbacks stable', () => {
    expect(decomposeDeltaCategory('')).toEqual({ base: 'NBC', fleet: 'NEW', seat: 'FO' })
  })
})
