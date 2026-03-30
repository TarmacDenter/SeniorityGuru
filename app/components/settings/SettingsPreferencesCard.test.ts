import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockSavePreference, mockToastAdd } = vi.hoisted(() => ({
  mockSavePreference: vi.fn().mockResolvedValue({ error: null }),
  mockToastAdd: vi.fn(),
}))

mockNuxtImport('useUser', () => () => ({
  retirementAge: { value: 65 },
  savePreference: mockSavePreference,
}))
mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }))

type CardVm = {
  state: { mandatoryRetirementAge: number }
  onSave: () => Promise<void>
}

describe('SettingsPreferencesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSavePreference.mockResolvedValue({ error: null })
  })

  it('calls savePreference with retirementAge on save', async () => {
    const Card = await import('./SettingsPreferencesCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as unknown as CardVm

    vm.state.mandatoryRetirementAge = 67
    await vm.onSave()

    expect(mockSavePreference).toHaveBeenCalledWith('retirementAge', 67)
  })

  it('shows success toast on save', async () => {
    const Card = await import('./SettingsPreferencesCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as unknown as CardVm

    await vm.onSave()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('shows error toast and not success toast on failure', async () => {
    mockSavePreference.mockResolvedValue({ error: new Error('forbidden') })
    const Card = await import('./SettingsPreferencesCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as unknown as CardVm

    await vm.onSave()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect(mockToastAdd).not.toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })
})
