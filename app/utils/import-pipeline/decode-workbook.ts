import * as XLSX from 'xlsx'
import type { DecodeWorkbookResult, SourceCellValue, SourceSheet } from './types'

export interface WorkbookFile {
  readonly name: string
  arrayBuffer(): Promise<ArrayBuffer>
}

function normalizeCell(value: unknown): SourceCellValue {
  if (typeof value === 'string') return value.trim() === '' ? null : value
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return null
}

function decodeSheet(name: string, index: number, worksheet: XLSX.WorkSheet): SourceSheet {
  const cells = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  })
  const width = cells.reduce((maximum, row) => Math.max(maximum, row.length), 0)
  const header = cells[0] ?? []

  return {
    id: `sheet:${index}`,
    name,
    columns: Array.from({ length: width }, (_, columnIndex) => ({
      id: `source:column:${columnIndex}`,
      label: typeof header[columnIndex] === 'string' ? header[columnIndex] : null,
    })),
    rows: cells.map((row, rowIndex) => ({
      id: `source:row:${rowIndex}`,
      cells: Array.from({ length: width }, (_, columnIndex) => normalizeCell(row[columnIndex])),
    })),
  }
}

/**
 * Decodes a browser-provided CSV, XLSX, or XLS file into library-independent
 * Source Sheets. The output omits workbook bytes, formulas, styles, and other
 * presentation details.
 */
export async function decodeWorkbook(file: WorkbookFile): Promise<DecodeWorkbookResult> {
  let bytes: ArrayBuffer
  try {
    bytes = await file.arrayBuffer()
  } catch {
    return {
      ok: false,
      error: {
        kind: 'file-read-failed',
        message: `Could not read ${file.name}. Choose another file and try again.`,
      },
    }
  }

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(bytes, { type: 'array', raw: true })
  } catch {
    return {
      ok: false,
      error: {
        kind: 'workbook-decode-failed',
        message: 'Could not decode this file. Choose a CSV, XLSX, or XLS spreadsheet.',
      },
    }
  }

  if (workbook.SheetNames.length === 0) {
    return {
      ok: false,
      error: {
        kind: 'no-sheets',
        message: 'This file contains no worksheets.',
      },
    }
  }

  return {
    ok: true,
    workbook: {
      sheetNames: [...workbook.SheetNames],
      sheets: workbook.SheetNames.map((name, index) => decodeSheet(name, index, workbook.Sheets[name]!)),
    },
  }
}
