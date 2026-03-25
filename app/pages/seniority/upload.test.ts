import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { DOMWrapper } from '@vue/test-utils'
import UploadPage from './upload.vue'

const { mockSave, mockReset, mockNavigateTo, mockColumnMap, mockMappingOptions, mockRawRows, mockSelectedParserId } = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockReset: vi.fn(),
  mockNavigateTo: vi.fn(),
  mockColumnMap: { value: { seniority_number: -1, employee_number: -1, seat: -1, base: -1, fleet: -1, hire_date: -1, retire_date: -1, name: -1 } },
  mockMappingOptions: { value: {} as Record<string, unknown> },
  mockRawRows: { value: [] as unknown[] },
  mockSelectedParserId: { value: 'generic' as string | null },
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useSeniorityUpload', () => () => ({
  save: mockSave,
  reset: mockReset,
  saving: { value: false },
  saveError: { value: null },
  fileName: { value: null },
  rawRows: mockRawRows,
  rawHeaders: { value: [] },
  entries: { value: [] },
  errorCount: { value: 0 },
  rowErrors: { value: new Map() },
  columnMap: mockColumnMap,
  mappingOptions: mockMappingOptions,
  selectedParserId: mockSelectedParserId,
  autoDetectSucceeded: { value: false },
  extractedEffectiveDate: { value: null },
  extractedTitle: { value: null },
  effectiveDate: { value: null },
  title: { value: '' },
  setFiles: vi.fn().mockResolvedValue(undefined),
  applyMapping: vi.fn(),
  updateCell: vi.fn(),
  deleteRow: vi.fn(),
}))

/** Returns true when the "Next" button exists and is NOT disabled. */
async function isNextEnabled(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.vm.$nextTick()
  const buttons = wrapper.findAll('button')
  const nextBtn = buttons.find((b: DOMWrapper<HTMLButtonElement>) => b.text().includes('Next'))
  if (!nextBtn) return false
  // attributes('disabled') returns undefined when not present, '' when present (empty attribute)
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

  it('does NOT call navigateTo when upload.save() throws', async () => {
    mockSave.mockRejectedValue(new Error('Upload failed'))

    const wrapper = await mountSuspended(UploadPage)
    await wrapper.vm.onSave()

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})

describe('upload page canAdvance — mapping step', () => {
  const allRequiredMapped = {
    seniority_number: 0,
    employee_number: 1,
    seat: 2,
    base: 3,
    fleet: 4,
    hire_date: 5,
    retire_date: 6,
    name: -1,
  }

  beforeEach(() => {
    // Start on upload step with rows so we can advance to mapping
    mockRawRows.value = [['a', 'b', 'c', 'd', 'e', 'f', 'g']]
    mockColumnMap.value = { ...allRequiredMapped }
    mockMappingOptions.value = { retireMode: 'direct' }
  })

  it('Next is disabled on mapping step when retire_date is unmapped and DOB mode is off', async () => {
    mockRawRows.value = [['a']]
    mockColumnMap.value = { ...allRequiredMapped, retire_date: -1 }
    mockMappingOptions.value = { retireMode: 'direct' }

    const wrapper = await mountSuspended(UploadPage)

    // Advance to mapping step by clicking Next on upload step
    const buttons = wrapper.findAll('button')
    const nextBtn = buttons.find(b => b.text().includes('Next'))
    expect(nextBtn).toBeDefined()
    await nextBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    // Now on mapping step — Next should be disabled because retire_date is unmapped
    expect(await isNextEnabled(wrapper)).toBe(false)
  })

  it('Next is enabled on mapping step when retire_date is mapped and DOB mode is off', async () => {
    mockRawRows.value = [['a']]
    mockColumnMap.value = { ...allRequiredMapped, retire_date: 6 }
    mockMappingOptions.value = { retireMode: 'direct' }

    const wrapper = await mountSuspended(UploadPage)

    const buttons = wrapper.findAll('button')
    const nextBtn = buttons.find(b => b.text().includes('Next'))
    await nextBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(await isNextEnabled(wrapper)).toBe(true)
  })

  it('Next is enabled on mapping step when retire_date is unmapped but DOB derivation mode is on', async () => {
    mockRawRows.value = [['a']]
    mockColumnMap.value = { ...allRequiredMapped, retire_date: -1 }
    mockMappingOptions.value = { retireMode: 'dob' }

    const wrapper = await mountSuspended(UploadPage)

    const buttons = wrapper.findAll('button')
    const nextBtn = buttons.find(b => b.text().includes('Next'))
    await nextBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(await isNextEnabled(wrapper)).toBe(true)
  })

  it('Next is disabled on mapping step when other required fields are missing', async () => {
    mockRawRows.value = [['a']]
    // hire_date unmapped, retire_date mapped
    mockColumnMap.value = { ...allRequiredMapped, hire_date: -1, retire_date: 6 }
    mockMappingOptions.value = { retireMode: 'direct' }

    const wrapper = await mountSuspended(UploadPage)

    const buttons = wrapper.findAll('button')
    const nextBtn = buttons.find(b => b.text().includes('Next'))
    await nextBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(await isNextEnabled(wrapper)).toBe(false)
  })
})
