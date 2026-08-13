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
  it('have unique namespaced IDs and prepare deterministic immutable output', () => {
    expect(new Set(importPlugins.map(plugin => plugin.id)).size).toBe(importPlugins.length)
    for (const plugin of importPlugins) {
      const first = prepareImport({ plugin, sourceSheet })
      const second = prepareImport({ plugin, sourceSheet })
      expect(first).toEqual(second)
      expect(first.preparedSheet.sourceSheet).toBe(sourceSheet)
      for (const column of first.preparedSheet.columns.filter(column => column.id.startsWith('plugin:'))) {
        expect(column.id).toMatch(new RegExp(`^plugin:${plugin.id}:`))
      }
    }
  })
})
