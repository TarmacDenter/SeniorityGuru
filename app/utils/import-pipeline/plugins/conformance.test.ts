import { describe, expect, it } from 'vitest'
import { importPlugins } from './registry'
import { prepareImport } from '../prepare-import'
import type { SourceSheet } from '../types'

const sourceSheet: SourceSheet = {
  id: 'sheet:test',
  name: 'Test',
  columns: [
    { id: 'source:column:0', label: 'Name' },
    { id: 'source:column:1', label: 'Base' },
  ],
  rows: [
    { id: 'source:row:0', cells: ['Name', 'Base'] },
    { id: 'source:row:1', cells: ['Example', 'JFK'] },
  ],
}

describe('registered Upload Types conformance', () => {
  it('satisfy the immutable, deterministic preparation contract', () => {
    expect(new Set(importPlugins.map(plugin => plugin.id)).size).toBe(importPlugins.length)

    for (const plugin of importPlugins) {
      expect(plugin.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(plugin.label).toBeTruthy()
      expect(plugin.description).toBeTruthy()
      expect(plugin.icon).toBeTruthy()
      expect(plugin.formatDescription).toBeTruthy()

      const frozenSource = structuredClone(sourceSheet)
      Object.freeze(frozenSource.columns)
      Object.freeze(frozenSource.rows)
      Object.freeze(frozenSource)
      const before = structuredClone(frozenSource)
      const first = prepareImport({ plugin, sourceSheet: frozenSource })
      const second = prepareImport({ plugin, sourceSheet: frozenSource })

      expect(first).toEqual(second)
      expect(frozenSource).toEqual(before)
      expect(first.preparedSheet.sourceSheet).toBe(frozenSource)
      expect(first.preparedSheet.rows.map(row => row.sourceRowId)).toEqual(frozenSource.rows.map(row => row.id))
      expect(first.preparedSheet.rows).toHaveLength(frozenSource.rows.length)
      for (const row of first.preparedSheet.rows) {
        expect(Object.keys(row.cells)).toEqual(expect.arrayContaining(frozenSource.columns.map(column => column.id)))
      }

      for (const column of first.preparedSheet.columns.filter(column => column.id.startsWith('plugin:'))) {
        expect(column.id).toMatch(new RegExp(`^plugin:${plugin.id}:`))
        expect(column.sourceColumnId).toBeTruthy()
      }
    }
  })
})
