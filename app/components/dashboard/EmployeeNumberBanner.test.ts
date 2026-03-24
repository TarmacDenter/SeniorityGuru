import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockSavePreference, mockToastAdd } = vi.hoisted(() => ({
  mockSavePreference: vi.fn().mockResolvedValue({ error: null }),
  mockToastAdd: vi.fn(),
}))

mockNuxtImport('useUser', () => () => ({
  savePreference: mockSavePreference,
}))
mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }))

type BannerVm = {
  employeeNumber: string
  validationError: string
  onSave: () => Promise<void>
}

describe('EmployeeNumberBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSavePreference.mockResolvedValue({ error: null })
  })

  it('calls savePreference with normalized employee number', async () => {
    const Banner = await import('./EmployeeNumberBanner.vue')
    const wrapper = await mountSuspended(Banner.default)
    const vm = wrapper.vm as unknown as BannerVm

    vm.employeeNumber = '00123'
    await vm.onSave()

    expect(mockSavePreference).toHaveBeenCalledWith('employeeNumber', '123')
  })

  it('emits saved on success', async () => {
    const Banner = await import('./EmployeeNumberBanner.vue')
    const wrapper = await mountSuspended(Banner.default)
    const vm = wrapper.vm as unknown as BannerVm

    vm.employeeNumber = '123'
    await vm.onSave()

    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  it('shows error toast and does not emit saved on API failure', async () => {
    mockSavePreference.mockResolvedValue({ error: new Error('forbidden') })
    const Banner = await import('./EmployeeNumberBanner.vue')
    const wrapper = await mountSuspended(Banner.default)
    const vm = wrapper.vm as unknown as BannerVm

    vm.employeeNumber = '123'
    await vm.onSave()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect(wrapper.emitted('saved')).toBeFalsy()
  })

  it('sets validationError for empty input without calling savePreference', async () => {
    const Banner = await import('./EmployeeNumberBanner.vue')
    const wrapper = await mountSuspended(Banner.default)
    const vm = wrapper.vm as unknown as BannerVm

    vm.employeeNumber = ''
    await vm.onSave()

    expect(vm.validationError).toBeTruthy()
    expect(mockSavePreference).not.toHaveBeenCalled()
  })

  it('sets validationError for too-long input without calling savePreference', async () => {
    const Banner = await import('./EmployeeNumberBanner.vue')
    const wrapper = await mountSuspended(Banner.default)
    const vm = wrapper.vm as unknown as BannerVm

    vm.employeeNumber = 'A'.repeat(21)
    await vm.onSave()

    expect(vm.validationError).toBeTruthy()
    expect(mockSavePreference).not.toHaveBeenCalled()
  })
})
