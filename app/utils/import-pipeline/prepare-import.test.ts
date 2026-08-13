// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { genericImportPlugin } from './plugins/generic'
import { defineImportPlugin, prepareImport } from './prepare-import'
import type { SourceSheet } from './types'

const sourceSheet: SourceSheet = {
  id: 'sheet:0',
  name: 'Roster',
  columns: [
    { id: 'source:column:0', label: 'Sen # ' },
    { id: 'source:column:1', label: 'Employee ID' },
    { id: 'source:column:2', label: 'Notes' },
  ],
  rows: [
    { id: 'source:row:0', cells: ['Sen # ', 'Employee ID', 'Notes'] },
    { id: 'source:row:1', cells: ['1', '123', 'new hire'] },
  ],
}

describe('prepareImport', () => {
  it('rejects an invalid plugin definition before it can enter the pipeline', () => {
    expect(() => defineImportPlugin({
      id: 'Generic Spreadsheet',
      label: 'Generic spreadsheet',
      description: 'Maps a spreadsheet.',
      prepare: () => ({}),
    })).toThrow('plugin id')
  })

  it('prepares immutable Generic canonical columns while retaining every source column and value', () => {
    const result = prepareImport({ plugin: genericImportPlugin, sourceSheet })

    expect(result.preparedSheet.columns).toEqual([
      ...sourceSheet.columns,
      {
        id: 'plugin:generic:seniority-number',
        label: 'Seniority Number',
        sourceColumnId: 'source:column:0',
      },
      {
        id: 'plugin:generic:employee-number',
        label: 'Employee Number',
        sourceColumnId: 'source:column:1',
      },
    ])
    expect(result.preparedSheet.rows[1]).toEqual({
      sourceRowId: 'source:row:1',
      cells: {
        'source:column:0': '1',
        'source:column:1': '123',
        'source:column:2': 'new hire',
        'plugin:generic:seniority-number': '1',
        'plugin:generic:employee-number': '123',
      },
    })
    expect(result.mappingSuggestions).toEqual({
      seniority_number: 'plugin:generic:seniority-number',
      employee_number: 'plugin:generic:employee-number',
    })
    expect(sourceSheet).toEqual({
      id: 'sheet:0',
      name: 'Roster',
      columns: [
        { id: 'source:column:0', label: 'Sen # ' },
        { id: 'source:column:1', label: 'Employee ID' },
        { id: 'source:column:2', label: 'Notes' },
      ],
      rows: [
        { id: 'source:row:0', cells: ['Sen # ', 'Employee ID', 'Notes'] },
        { id: 'source:row:1', cells: ['1', '123', 'new hire'] },
      ],
    })
  })

  it('leaves ambiguous aliases unresolved while preserving all source columns', () => {
    const result = prepareImport({
      plugin: genericImportPlugin,
      sourceSheet: {
        ...sourceSheet,
        columns: [
          { id: 'source:column:0', label: 'Base' },
          { id: 'source:column:1', label: 'Domicile' },
        ],
        rows: [
          { id: 'source:row:0', cells: ['Base', 'Domicile'] },
          { id: 'source:row:1', cells: ['BOS', 'BOS'] },
        ],
      },
    })

    expect(result.mappingSuggestions.base).toBeUndefined()
    expect(result.issues).toContainEqual({
      kind: 'ambiguous-alias',
      field: 'base',
      message: 'More than one column looks like Base. Choose the correct column.',
    })
    expect(result.preparedSheet.columns).toEqual([
      { id: 'source:column:0', label: 'Base' },
      { id: 'source:column:1', label: 'Domicile' },
    ])
  })

  it('falls back to the unchanged source sheet when preparation throws', () => {
    const plugin = {
      ...genericImportPlugin,
      prepare: () => { throw new Error('bad spreadsheet') },
    }

    const result = prepareImport({ plugin, sourceSheet })

    expect(result.preparedSheet.sourceSheet).toBe(sourceSheet)
    expect(result.preparedSheet.columns).toEqual(sourceSheet.columns)
    expect(result.issues).toEqual([{
      kind: 'preparation-failed',
      message: 'This Upload Type could not prepare the sheet. Match the columns manually.',
    }])
  })

  it('honors an explicit header-row choice over the decoded first row', () => {
    const result = prepareImport({
      plugin: genericImportPlugin,
      sourceSheet: {
        ...sourceSheet,
        columns: [
          { id: 'source:column:0', label: 'Untitled 1' },
          { id: 'source:column:1', label: 'Untitled 2' },
        ],
        rows: [
          { id: 'source:row:0', cells: ['January roster', null] },
          { id: 'source:row:1', cells: ['Seniority Number', 'Employee Number'] },
          { id: 'source:row:2', cells: ['1', '123'] },
        ],
      },
      headerRowIndex: 1,
    })

    expect(result.mappingSuggestions).toEqual({
      seniority_number: 'plugin:generic:seniority-number',
      employee_number: 'plugin:generic:employee-number',
    })
    expect(result.preparedSheet.rows.map(row => row.sourceRowId)).toEqual(['source:row:2'])
  })
})
