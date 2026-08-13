// @vitest-environment node
import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { decodeWorkbook } from './decode-workbook'

function workbookFile(name: string, sheets: Record<string, unknown[][]>) {
  const workbook = XLSX.utils.book_new()

  for (const [sheetName, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName)
  }

  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return {
    name,
    arrayBuffer: async () => bytes as ArrayBuffer,
  }
}

describe('decodeWorkbook', () => {
  it('preserves basic cell values and gives every source row and column a stable identity', async () => {
    const result = await decodeWorkbook(workbookFile('roster.xlsx', {
      Roster: [
        ['Employee Number', 'Active', 'Note'],
        [123, true, '  '],
      ],
    }))

    expect(result).toEqual({
      ok: true,
      workbook: {
        sheetNames: ['Roster'],
        sheets: [{
          id: 'sheet:0',
          name: 'Roster',
          columns: [
            { id: 'source:column:0', label: 'Employee Number' },
            { id: 'source:column:1', label: 'Active' },
            { id: 'source:column:2', label: 'Note' },
          ],
          rows: [
            { id: 'source:row:0', cells: ['Employee Number', 'Active', 'Note'] },
            { id: 'source:row:1', cells: [123, true, null] },
          ],
        }],
      },
    })
  })

  it('keeps each worksheet available for explicit selection', async () => {
    const result = await decodeWorkbook(workbookFile('roster.xlsx', {
      Domestic: [['Name'], ['Ada']],
      International: [['Name'], ['Bryn']],
    }))

    expect(result).toMatchObject({
      ok: true,
      workbook: {
        sheetNames: ['Domestic', 'International'],
        sheets: [
          { id: 'sheet:0', name: 'Domestic' },
          { id: 'sheet:1', name: 'International' },
        ],
      },
    })
  })

  it('returns an actionable error when the browser cannot read the file', async () => {
    const result = await decodeWorkbook({
      name: 'broken.xlsx',
      arrayBuffer: async () => { throw new Error('read failed') },
    })

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'file-read-failed',
        message: 'Could not read broken.xlsx. Choose another file and try again.',
      },
    })
  })
})
