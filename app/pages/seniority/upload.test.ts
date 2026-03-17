import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import UploadPage from './upload.vue'

const { mockSave, mockReset, mockNavigateTo } = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockReset: vi.fn(),
  mockNavigateTo: vi.fn(),
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useSeniorityUpload', () => () => ({
  save: mockSave,
  reset: mockReset,
  saving: { value: false },
  saveError: { value: null },
  fileName: { value: null },
  rawRows: { value: [] },
  rawHeaders: { value: [] },
  entries: { value: [] },
  errorCount: { value: 0 },
  rowErrors: { value: new Map() },
  columnMap: { value: {} },
  mappingOptions: { value: {} },
  effectiveDate: { value: null },
  title: { value: '' },
  setFiles: vi.fn().mockResolvedValue(undefined),
  applyMapping: vi.fn(),
  updateCell: vi.fn(),
  deleteRow: vi.fn(),
}))

describe('upload page onSave', () => {
  beforeEach(() => {
    mockSave.mockReset()
    mockReset.mockReset()
    mockNavigateTo.mockReset()
  })

  it('calls navigateTo with dashboard/seniority after successful save', async () => {
    mockSave.mockResolvedValue(42)
    mockNavigateTo.mockResolvedValue(undefined)

    const wrapper = await mountSuspended(UploadPage)
    await wrapper.vm.onSave()

    expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/dashboard', query: { tab: 'seniority' } })
  })

  it('awaits navigateTo before onSave resolves', async () => {
    let navResolve!: () => void
    const navPromise = new Promise<void>(resolve => { navResolve = resolve })
    mockSave.mockResolvedValue(10)
    mockNavigateTo.mockReturnValue(navPromise)

    const savePromise = (async () => {
      const wrapper = await mountSuspended(UploadPage)
      return wrapper.vm.onSave()
    })()

    await new Promise(resolve => setTimeout(resolve, 10))
    let resolved = false
    savePromise.then(() => { resolved = true })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(resolved).toBe(false)

    navResolve()
    await savePromise
    expect(resolved).toBe(true)
  })

  it('does NOT call navigateTo when upload.save() throws', async () => {
    mockSave.mockRejectedValue(new Error('Upload failed'))

    const wrapper = await mountSuspended(UploadPage)
    await wrapper.vm.onSave()

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
