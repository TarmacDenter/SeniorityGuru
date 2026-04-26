import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityUpload } from './index'
import { makePartialEntry, makeDomainEntry } from '~/test-utils/factories'

const mockStore = vi.hoisted(() => ({
  addList: vi.fn(),
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))

// Mock XLSX — the orchestrator doesn't call it directly but _useFileIO does
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: { sheet_to_json: vi.fn() },
}))

vi.mock('~/utils/parsers/registry', () => ({
  getParser: () => ({
    id: 'generic',
    parse: vi.fn().mockReturnValue({
      rows: [],
      metadata: { effectiveDate: null, title: null },
    }),
  }),
}))

describe('useSeniorityUpload (orchestrator)', () => {
  beforeEach(() => {
    mockStore.addList.mockReset()
    mockStore.addList.mockResolvedValue(99)
  })

  it('returns grouped interface with all phases', () => {
    const upload = useSeniorityUpload()
    expect(upload.selectedParserId).toBeDefined()
    expect(upload.file).toBeDefined()
    expect(upload.mapping).toBeDefined()
    expect(upload.review).toBeDefined()
    expect(upload.confirm).toBeDefined()
    expect(upload.progress).toBeDefined()
    expect(upload.reset).toBeInstanceOf(Function)
  })

  it('file phase exposes expected interface', () => {
    const upload = useSeniorityUpload()
    expect(upload.file.fileName.value).toBe('')
    expect(upload.file.sheetNames.value).toEqual([])
    expect(upload.file.hasData.value).toBe(false)
    expect(upload.file.setFile).toBeInstanceOf(Function)
    expect(upload.file.selectSheet).toBeInstanceOf(Function)
  })

  it('mapping phase exposes expected interface', () => {
    const upload = useSeniorityUpload()
    expect(upload.mapping.columnMap.value).toBeDefined()
    expect(upload.mapping.mappingOptions.value).toBeDefined()
    expect(upload.mapping.canAdvance.value).toBe(false)
    expect(upload.mapping.apply).toBeInstanceOf(Function)
  })

  it('review phase exposes expected interface', () => {
    const upload = useSeniorityUpload()
    expect(upload.review.entries.value).toEqual([])
    expect(upload.review.rowErrors.value.size).toBe(0)
    expect(upload.review.errorCount.value).toBe(0)
    expect(upload.review.canAdvance.value).toBe(false)
    expect(upload.review.updateCell).toBeInstanceOf(Function)
    expect(upload.review.deleteRow).toBeInstanceOf(Function)
    expect(upload.review.deleteErrorRows).toBeInstanceOf(Function)
  })

  it('confirm phase exposes expected interface', () => {
    const upload = useSeniorityUpload()
    expect(upload.confirm.effectiveDate.value).toBeNull()
    expect(upload.confirm.title.value).toBe('')
    expect(upload.confirm.saving.value).toBe(false)
    expect(upload.confirm.save).toBeInstanceOf(Function)
  })

  it('progress starts idle', () => {
    const upload = useSeniorityUpload()
    expect(upload.progress.phase.value).toBe('idle')
    expect(upload.progress.busy.value).toBe(false)
    expect(upload.progress.percent.value).toBeNull()
  })

  describe('review operations via orchestrator', () => {
    it('deleteRow works through the orchestrator', () => {
      const upload = useSeniorityUpload()
      upload.review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 3, employee_number: '300' }),
      ]

      upload.review.deleteRow(1)

      expect(upload.review.entries.value).toHaveLength(2)
      expect(upload.review.entries.value.map(e => e.employee_number)).toEqual(['100', '300'])
    })

    it('deleteErrorRows works through the orchestrator', () => {
      const upload = useSeniorityUpload()
      upload.review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 3, employee_number: '300' }),
      ]
      upload.review.rowErrors.value = new Map([[1, ['bad']]])

      const deleted = upload.review.deleteErrorRows()

      expect(deleted).toBe(1)
      expect(upload.review.entries.value).toHaveLength(2)
    })
  })

  describe('confirm.save via orchestrator', () => {
    it('saves entries through the store', async () => {
      const upload = useSeniorityUpload()
      upload.confirm.effectiveDate.value = { toString: () => '2025-01-01' } as never
      upload.confirm.title.value = 'Test'

      upload.review.entries.value = [
        makeDomainEntry({ seniority_number: 1, employee_number: 'E001', seat: 'CA', base: 'LAX', fleet: 'B737', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
      ]

      const count = await upload.confirm.save(upload.review.toValidatedEntries())

      expect(count).toBe(1)
      expect(mockStore.addList).toHaveBeenCalledTimes(1)
    })
  })

  describe('reset', () => {
    it('clears all phases', () => {
      const upload = useSeniorityUpload()
      upload.selectedParserId.value = 'delta'
      upload.review.entries.value = [makePartialEntry({ seniority_number: 1 })]
      upload.review.rowErrors.value = new Map([[0, ['err']]])
      upload.confirm.title.value = 'Something'

      upload.reset()

      expect(upload.selectedParserId.value).toBeNull()
      expect(upload.review.entries.value).toEqual([])
      expect(upload.review.rowErrors.value.size).toBe(0)
      expect(upload.confirm.title.value).toBe('')
      expect(upload.confirm.effectiveDate.value).toBeNull()
      expect(upload.file.fileName.value).toBe('')
    })
  })
})
