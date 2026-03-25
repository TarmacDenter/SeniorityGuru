import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { DOMWrapper } from '@vue/test-utils'
import UploadPage from './upload.vue'

const {
  mockSave,
  mockReset,
  mockNavigateTo,
  mockFileHasData,
  mockFileAutoDetected,
  mockMappingCanAdvance,
  mockReviewCanAdvance,
  mockApplyMapping,
  mockSelectedParserId,
} = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockReset: vi.fn(),
  mockNavigateTo: vi.fn(),
  mockFileHasData: { value: false },
  mockFileAutoDetected: { value: false },
  mockMappingCanAdvance: { value: false },
  mockReviewCanAdvance: { value: false },
  mockApplyMapping: vi.fn().mockResolvedValue(undefined),
  mockSelectedParserId: { value: 'generic' as string | null },
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useSeniorityUpload', () => () => ({
  selectedParserId: mockSelectedParserId,
  file: {
    fileName: { value: null },
    sheetNames: { value: [] },
    selectedSheet: { value: null },
    needsSheetSelection: { value: false },
    hasData: mockFileHasData,
    autoDetected: mockFileAutoDetected,
    error: { value: null },
    setFile: vi.fn().mockResolvedValue(undefined),
    selectSheet: vi.fn(),
  },
  mapping: {
    columnMap: { value: { seniority_number: -1, employee_number: -1, seat: -1, base: -1, fleet: -1, hire_date: -1, retire_date: -1, name: -1 } },
    mappingOptions: { value: {} },
    headers: { value: [] },
    sampleRows: { value: [] },
    canAdvance: mockMappingCanAdvance,
    apply: mockApplyMapping,
  },
  review: {
    entries: { value: [] },
    rowErrors: { value: new Map() },
    errorCount: { value: 0 },
    syntheticNote: { value: null },
    syntheticIndices: { value: new Set() },
    canAdvance: mockReviewCanAdvance,
    updateCell: vi.fn(),
    deleteRow: vi.fn(),
    deleteErrorRows: vi.fn().mockReturnValue(0),
  },
  confirm: {
    effectiveDate: { value: null },
    title: { value: '' },
    saving: { value: false },
    error: { value: null },
    save: mockSave,
  },
  progress: {
    phase: { value: 'idle' },
    percent: { value: null },
    busy: { value: false },
  },
  reset: mockReset,
}))

async function isNextEnabled(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.vm.$nextTick()
  const buttons = wrapper.findAll('button')
  const nextBtn = buttons.find((b: DOMWrapper<HTMLButtonElement>) => b.text().includes('Next'))
  if (!nextBtn) return false
  return nextBtn.attributes('disabled') === undefined
}

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

  it('does NOT call navigateTo when upload.confirm.save() throws', async () => {
    mockSave.mockRejectedValue(new Error('Upload failed'))

    const wrapper = await mountSuspended(UploadPage)
    await wrapper.vm.onSave()

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})

describe('upload page canAdvance — mapping step', () => {
  beforeEach(() => {
    mockFileHasData.value = true
    mockFileAutoDetected.value = false
    mockMappingCanAdvance.value = false
  })

  it('Next is disabled on mapping step when mapping.canAdvance is false', async () => {
    mockMappingCanAdvance.value = false

    const wrapper = await mountSuspended(UploadPage)

    // Advance to mapping step
    const buttons = wrapper.findAll('button')
    const nextBtn = buttons.find(b => b.text().includes('Next'))
    expect(nextBtn).toBeDefined()
    await nextBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(await isNextEnabled(wrapper)).toBe(false)
  })

  it('Next is enabled on mapping step when mapping.canAdvance is true', async () => {
    mockMappingCanAdvance.value = true

    const wrapper = await mountSuspended(UploadPage)

    const buttons = wrapper.findAll('button')
    const nextBtn = buttons.find(b => b.text().includes('Next'))
    await nextBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(await isNextEnabled(wrapper)).toBe(true)
  })
})
