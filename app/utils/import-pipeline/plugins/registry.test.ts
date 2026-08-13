import { describe, expect, it } from 'vitest'
import { importPlugins } from './registry'
import { prepareImport } from '../prepare-import'
import type { SourceSheet } from '../types'

const sourceSheet: SourceSheet = {
  id: 'sheet:test',
  name: 'Test',
  columns: [{ id: 'source:column:0', label: 'Name' }],
  rows: [{ id: 'source:row:0', cells: ['Name'] }, { id: 'source:row:1', cells: ['Example'] }],
}

describe('registered Import Plugins', () => {
  it('conform to the shared preparation contract', () => {
    expect(new Set(importPlugins.map(plugin => plugin.id)).size).toBe(importPlugins.length)
    for (const plugin of importPlugins) {
      const frozenSource = structuredClone(sourceSheet)
      Object.freeze(frozenSource.columns)
      Object.freeze(frozenSource.rows)
      Object.freeze(frozenSource)
      const first = prepareImport({ plugin, sourceSheet: frozenSource })
      const second = prepareImport({ plugin, sourceSheet: frozenSource })
      expect(first).toEqual(second)
      expect(first.preparedSheet.sourceSheet).toBe(frozenSource)
      expect(first.preparedSheet.rows).toHaveLength(frozenSource.rows.length)
      expect(first.preparedSheet.rows.map(row => row.sourceRowId)).toEqual(frozenSource.rows.map(row => row.id))
      expect(Object.keys(first.mappingSuggestions)).toEqual(expect.arrayContaining(
        first.preparedSheet.columns.filter(column => column.id.startsWith('plugin:')).map(column =>
          column.id.slice(`plugin:${plugin.id}:`.length).replace(/-/g, '_'),
        ),
      ))
      for (const column of first.preparedSheet.columns.filter(column => column.id.startsWith('plugin:'))) {
        expect(column.id).toMatch(new RegExp(`^plugin:${plugin.id}:`))
        expect(column.sourceColumnId).toBeTruthy()
      }
    }
  })
})
