// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { processConfirmedMappings } from './process-confirmed-mappings'
import type { PreparedSheet } from './types'

const preparedSheet: PreparedSheet = {
  sourceSheet: {
    id: 'sheet:0',
    name: 'Roster',
    columns: [],
    rows: [],
  },
  columns: [
    { id: 'seniority', label: 'Seniority' },
    { id: 'employee', label: 'Employee' },
    { id: 'seat', label: 'Seat' },
    { id: 'base', label: 'Base' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'hire', label: 'Hire' },
    { id: 'retire', label: 'Retire' },
  ],
  rows: [{
    sourceRowId: 'source:row:1',
    cells: {
      seniority: ' 1 ', employee: '00123', seat: ' fo ', base: ' bos ', fleet: ' a220 ',
      hire: '1/2/75', retire: '1/2/62',
    },
  }],
}

describe('processConfirmedMappings', () => {
  it('converts confirmed columns into a normalized review draft', async () => {
    const result = await processConfirmedMappings({
      preparedSheet,
      mappings: {
        seniority_number: { kind: 'column', columnId: 'seniority' },
        employee_number: { kind: 'column', columnId: 'employee' },
        seat: { kind: 'column', columnId: 'seat' },
        base: { kind: 'column', columnId: 'base' },
        fleet: { kind: 'column', columnId: 'fleet' },
        hire_date: { kind: 'column', columnId: 'hire' },
        retire_date: { kind: 'column', columnId: 'retire' },
      },
    })

    expect(result.drafts).toEqual([{
      id: 'draft:source:row:1',
      sourceRowId: 'source:row:1',
      entry: {
        seniority_number: 1,
        employee_number: '123',
        seat: 'FO',
        base: 'BOS',
        fleet: 'A220',
        hire_date: '1975-01-02',
        retire_date: '2062-01-02',
      },
      issues: [],
    }])
  })

  it('keeps one failed transformation row while continuing later rows', async () => {
    const result = await processConfirmedMappings({
      preparedSheet: {
        ...preparedSheet,
        rows: [
          preparedSheet.rows[0]!,
          { ...preparedSheet.rows[0]!, sourceRowId: 'source:row:2', cells: { ...preparedSheet.rows[0]!.cells, employee: '00124' } },
        ],
      },
      mappings: {
        seniority_number: { kind: 'column', columnId: 'seniority' },
        employee_number: { kind: 'column', columnId: 'employee' },
        seat: { kind: 'column', columnId: 'seat' },
        base: { kind: 'column', columnId: 'base' },
        fleet: { kind: 'column', columnId: 'fleet' },
        hire_date: { kind: 'column', columnId: 'hire' },
        retire_date: { kind: 'column', columnId: 'retire' },
      },
      plugin: {
        id: 'test', label: 'Test', description: 'Test plugin', icon: 'i-lucide-test', formatDescription: 'Test format.', prepare: () => ({}),
        transformMappedEntry: ({ draft }) => {
          if (draft.sourceRowId === 'source:row:1') throw new Error('bad row')
          return { entry: { base: 'JFK' } }
        },
      },
    })

    expect(result.drafts[0]!.entry.base).toBe('BOS')
    expect(result.drafts[0]!.issues).toContainEqual({
      kind: 'transformation-failed',
      message: 'This row could not be transformed. Review its mapped values.',
    })
    expect(result.drafts[1]!.entry.base).toBe('JFK')
  })

  it('preserves a row when a transformation returns an invalid patch', async () => {
    const result = await processConfirmedMappings({
      preparedSheet: {
        ...preparedSheet,
        rows: [
          preparedSheet.rows[0]!,
          { ...preparedSheet.rows[0]!, sourceRowId: 'source:row:2' },
        ],
      },
      mappings: {
        base: { kind: 'column', columnId: 'base' },
      },
      plugin: {
        id: 'test', label: 'Test', description: 'Test plugin', icon: 'i-lucide-test', formatDescription: 'Test format.', prepare: () => ({}),
        transformMappedEntry: ({ draft }) => draft.sourceRowId === 'source:row:1'
          ? { entry: { unknown_field: 'not allowed' } }
          : { entry: { base: 'JFK' } },
      },
    })

    expect(result.drafts[0]!.entry.base).toBe('BOS')
    expect(result.drafts[0]!.issues[0]!.kind).toBe('transformation-failed')
    expect(result.drafts[1]!.entry.base).toBe('JFK')
  })

  it('does not allow a plugin to mutate transformation inputs', async () => {
    const result = await processConfirmedMappings({
      preparedSheet,
      mappings: { base: { kind: 'column', columnId: 'base' } },
      plugin: {
        id: 'test', label: 'Test', description: 'Test plugin', icon: 'i-lucide-test', formatDescription: 'Test format.', prepare: () => ({}),
        transformMappedEntry: ({ draft }) => {
          ;(draft.entry as Record<string, unknown>).base = 'MUTATED'
          return {}
        },
      },
    })

    expect(result.drafts[0]!.entry.base).toBe('BOS')
    expect(result.drafts[0]!.issues[0]!.kind).toBe('transformation-failed')
  })

  it('rejects an already-cancelled request before processing rows', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(processConfirmedMappings({
      preparedSheet,
      mappings: {},
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' })
  })
})
