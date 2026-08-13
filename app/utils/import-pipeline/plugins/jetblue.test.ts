import { describe, expect, it } from 'vitest'
import { hasJetBlueEuMarker, jetblueImportPlugin } from './jetblue'
import { prepareImport } from '../prepare-import'
import { processConfirmedMappings } from '../process-confirmed-mappings'

describe('jetblueImportPlugin', () => {
  it('detects only standalone EU markers', () => {
    expect(hasJetBlueEuMarker('Michael -EU Dempsey')).toBe(true)
    expect(hasJetBlueEuMarker('Michael-EU Dempsey')).toBe(false)
    expect(hasJetBlueEuMarker('Michael -EUROPE Dempsey')).toBe(false)
  })

  it('derives canonical mappings and appends EU to the base once', async () => {
    const sourceSheet = {
      id: 'sheet:0', name: 'JetBlue',
      columns: ['SEN', 'CMID', 'NAME', 'BASE', 'FLEET', 'SEAT', 'HIREDATE', 'RTRDATE'].map((label, index) => ({ id: `source:column:${index}`, label })),
      rows: [
        { id: 'source:row:0', cells: ['SEN', 'CMID', 'NAME', 'BASE', 'FLEET', 'SEAT', 'HIREDATE', 'RTRDATE'] },
        { id: 'source:row:1', cells: ['1', '123', 'Michael -EU Dempsey', 'bos', '320', 'fo', '1/2/2000', '1/2/55'] },
      ],
    } as const
    const prepared = prepareImport({ plugin: jetblueImportPlugin, sourceSheet, headerRowIndex: 0 })
    const result = await processConfirmedMappings({
      preparedSheet: prepared.preparedSheet,
      mappings: Object.fromEntries(Object.entries(prepared.mappingSuggestions).map(([field, columnId]) => [field, { kind: 'column', columnId }])) as never,
      plugin: jetblueImportPlugin,
    })
    expect(result.drafts[0]!.entry.base).toBe('BOS-EU')
    expect(result.drafts[0]!.entry.retire_date).toBe('2055-01-02')
  })
})
