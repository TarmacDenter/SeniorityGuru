import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockSavePreference, mockToastAdd } = vi.hoisted(() => ({
  mockSavePreference: vi.fn().mockResolvedValue({ error: null }),
  mockToastAdd: vi.fn(),
}))

mockNuxtImport('useUser', () => () => ({
  employeeNumber: { value: null },
  savePreference: mockSavePreference,
}))
mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }))

type CardVm = {
  employeeNumberInput: string
  onSave: () => Promise<void>
}

describe('SettingsProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSavePreference.mockResolvedValue({ error: null })
  })

  it('calls savePreference with normalized employee number', async () => {
    const Card = await import('./SettingsProfileCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as unknown as CardVm

    vm.employeeNumberInput = '00123'
    await vm.onSave()

    expect(mockSavePreference).toHaveBeenCalledWith('employeeNumber', '123')
  })

  it('calls savePreference with empty string when input is blank', async () => {
    const Card = await import('./SettingsProfileCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as unknown as CardVm

    vm.employeeNumberInput = ''
    await vm.onSave()

    expect(mockSavePreference).toHaveBeenCalledWith('employeeNumber', '')
  })

  it('shows success toast on save', async () => {
    const Card = await import('./SettingsProfileCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as unknown as CardVm

    await vm.onSave()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('shows error toast and not success toast on failure', async () => {
    mockSavePreference.mockResolvedValue({ error: new Error('forbidden') })
    const Card = await import('./SettingsProfileCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as unknown as CardVm

    await vm.onSave()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect(mockToastAdd).not.toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })
})
