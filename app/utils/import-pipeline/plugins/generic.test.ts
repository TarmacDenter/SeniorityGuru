// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { genericImportPlugin } from './generic'
import { prepareImport } from '../prepare-import'
import { IMPORT_FIELDS } from '../fields'
import type { SourceSheet } from '../types'

function sheetWith(headers: readonly string[]): SourceSheet {
  return {
    id: 'sheet:0',
    name: 'Roster',
    columns: headers.map((label, index) => ({ id: `source:column:${index}`, label })),
    rows: [{ id: 'source:row:0', cells: [...headers] }],
  }
}

describe('genericImportPlugin', () => {
  it('suggests every field for abbreviated airline-export headings', () => {
    const sourceSheet = sheetWith(['SEN', 'CMID', 'NAME', 'BASE', 'FLEET', 'SEAT', 'HIREDATE', 'RTRDATE'])
    const { mappingSuggestions } = prepareImport({ plugin: genericImportPlugin, sourceSheet })
    expect(Object.keys(mappingSuggestions).sort()).toEqual([...IMPORT_FIELDS].sort())
  })

  it.each([
    ['Emp No', 'employee_number'],
    ['File Number', 'employee_number'],
    ['A/C', 'fleet'],
    ['Ret Date', 'retire_date'],
    ['Date Hired', 'hire_date'],
    ['Crew Base', 'base'],
  ] as const)('suggests %s for %s', (header, field) => {
    const { mappingSuggestions } = prepareImport({ plugin: genericImportPlugin, sourceSheet: sheetWith([header]) })
    expect(mappingSuggestions[field]).toBeDefined()
  })

  it('leaves a field unmapped when two headings match it', () => {
    const sourceSheet = sheetWith(['Name', 'Employee Name'])
    const result = prepareImport({ plugin: genericImportPlugin, sourceSheet })
    expect(result.mappingSuggestions.name).toBeUndefined()
    expect(result.issues).toContainEqual(expect.objectContaining({ kind: 'ambiguous-alias', field: 'name' }))
  })
})
