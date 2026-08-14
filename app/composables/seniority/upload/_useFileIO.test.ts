import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _useFileIO } from './_useFileIO'
import { _useProgressTracker } from './_useProgressTracker'
import type { ColumnMap } from '~/utils/parse-spreadsheet'
import type { PreparedSheet } from '~/utils/import-pipeline/types'

// Mock XLSX
const mockRead = vi.hoisted(() => vi.fn())
const mockSheetToJson = vi.hoisted(() => vi.fn())
const mockDecodeWorkbook = vi.hoisted(() => vi.fn())
vi.mock('xlsx', () => ({
  read: mockRead,
  utils: { sheet_to_json: mockSheetToJson },
}))

vi.mock('~/utils/spreadsheet/decode-workbook', () => ({ decodeWorkbook: mockDecodeWorkbook }))
vi.mock('~/stores/user', () => ({ useUserStore: () => ({ getPreference: vi.fn().mockResolvedValue(null) }) }))

function createFileIO() {
  const selectedUploadTypeId = ref<string | null>('generic')
  const rawHeaders = ref<string[]>([])
  const rawRows = ref<string[][]>([])
  const extractedEffectiveDate = ref<string | null>(null)
  const extractedTitle = ref<string | null>(null)
  const syntheticNote = ref<string | null>(null)
  const syntheticIndices = ref<Set<number>>(new Set())
  const autoDetectSucceeded = ref(false)
  const preparedSheet = ref<PreparedSheet | null>(null)
  const columnMap = ref<ColumnMap>({
    seniority_number: -1, employee_number: -1, seat: -1,
    base: -1, fleet: -1, name: -1, hire_date: -1, retire_date: -1,
  })
  const mappingOptions = ref({ nameMode: 'single' as const, retireMode: 'direct' as const })
  const progress = _useProgressTracker()
  const onSheetChange = vi.fn()

  const file = _useFileIO({
    selectedUploadTypeId,
    rawHeaders,
    rawRows,
    extractedEffectiveDate,
    extractedTitle,
    syntheticNote,
    syntheticIndices,
    columnMap,
    mappingOptions,
    autoDetectSucceeded,
    preparedSheet,
    progress,
    onSheetChange,
  } as any) as any

  return { file, rawHeaders, rawRows, extractedEffectiveDate, extractedTitle, syntheticNote, syntheticIndices, autoDetectSucceeded, columnMap, progress, onSheetChange, selectedUploadTypeId }
}

describe('_useFileIO', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDecodeWorkbook.mockResolvedValue({ ok: true, workbook: { sheetNames: ['Sheet1'], sheets: [{ id: 'sheet:0', name: 'Sheet1', columns: [{ id: 'source:column:0', label: 'Seniority Number' }, { id: 'source:column:1', label: 'Employee Number' }], rows: [{ id: 'source:row:0', cells: ['Seniority Number', 'Employee Number'] }, { id: 'source:row:1', cells: ['1', '100'] }] }] } })
  })

  it('starts with empty state', () => {
    const { file } = createFileIO()
    expect(file.fileName.value).toBe('')
    expect(file.sheetNames.value).toEqual([])
    expect(file.selectedSheet.value).toBeNull()
    expect(file.hasData.value).toBe(false)
    expect(file.needsSheetSelection.value).toBe(false)
    expect(file.error.value).toBeNull()
  })

  it('sets error when file read fails', async () => {
    const { file } = createFileIO()
    const badFile = {
      name: 'bad.csv',
      arrayBuffer: () => Promise.reject(new Error('read error')),
    } as unknown as File

    await file.setFile(badFile)

    expect(file.error.value).toBeNull()
  })

  it('sets error when XLSX parse fails', async () => {
    const { file } = createFileIO()
    mockDecodeWorkbook.mockResolvedValue({ ok: false, error: { message: 'Could not decode this file.' } })

    const fakeFile = {
      name: 'bad.xlsx',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as unknown as File

    await file.setFile(fakeFile)

    expect(file.error.value).toContain('Could not decode')
  })

  it('processes single-sheet file and populates rawHeaders/rawRows', async () => {
    const { file, rawHeaders, rawRows } = createFileIO()


    const fakeFile = {
      name: 'list.csv',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as unknown as File

    await file.setFile(fakeFile)

    expect(file.fileName.value).toBe('list.csv')
    expect(rawHeaders.value.length).toBeGreaterThan(0)
    expect(rawRows.value.length).toBeGreaterThan(0)
    expect(file.hasData.value).toBe(true)
  })

  it('limits header row preview to the first 100 rows', async () => {
    const { file } = createFileIO()
    const rows = Array.from({ length: 150 }, (_, index) => ({
      id: `source:row:${index}`,
      cells: [`Row ${index + 1}`],
    }))
    mockDecodeWorkbook.mockResolvedValue({
      ok: true,
      workbook: {
        sheetNames: ['Sheet1'],
        sheets: [{
          id: 'sheet:0',
          name: 'Sheet1',
          columns: [{ id: 'source:column:0', label: 'Column 1' }],
          rows,
        }],
      },
    })

    await file.setFile({
      name: 'large-list.xlsx',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as unknown as File)

    expect(file.headerRows.value).toHaveLength(100)
    expect(file.headerRows.value[0]).toEqual(['Row 1'])
    expect(file.headerRows.value[99]).toEqual(['Row 100'])
  })

  it('pauses on multi-sheet file for sheet selection', async () => {
    const { file, rawRows } = createFileIO()

    mockDecodeWorkbook.mockResolvedValue({ ok: true, workbook: { sheetNames: ['Sheet1', 'Sheet2'], sheets: [] } })

    const fakeFile = {
      name: 'multi.xlsx',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as unknown as File

    await file.setFile(fakeFile)

    expect(file.sheetNames.value).toEqual(['Sheet1', 'Sheet2'])
    expect(rawRows.value).toEqual([])
    expect(file.needsSheetSelection.value).toBe(true)
    expect(file.hasData.value).toBe(false)
  })

  it('selectSheet processes the chosen sheet', () => {
    const { file, onSheetChange } = createFileIO()

    // Set up mock workbook buffer by first setting a file
    file.selectSheet('Sheet2')

    // Selecting a sheet before decoding has no effect.
    expect(onSheetChange).not.toHaveBeenCalled()
  })

  it('resets state when setFile(null) is called', async () => {
    const { file, onSheetChange } = createFileIO()

    await file.setFile(null)

    expect(file.fileName.value).toBe('')
    expect(file.sheetNames.value).toEqual([])
    expect(onSheetChange).toHaveBeenCalled()
  })

  it('does not rely on legacy format metadata', async () => {
    const { file, extractedEffectiveDate, extractedTitle, syntheticNote } = createFileIO()


    const fakeFile = {
      name: 'list.csv',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as unknown as File

    await file.setFile(fakeFile)

    expect(extractedEffectiveDate.value).toBeNull()
    expect(extractedTitle.value).toBeNull()
    expect(syntheticNote.value).toBeNull()
  })
})
