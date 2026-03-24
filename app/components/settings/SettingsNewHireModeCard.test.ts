import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockEnabled, mockReset, mockToastAdd } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockEnabled: vRef(false),
    mockReset: vi.fn(),
    mockToastAdd: vi.fn(),
  }
})

mockNuxtImport('useSeniorityCore', () => () => ({
  newHire: {
    enabled: mockEnabled,
    selectedBase: { value: null },
    selectedSeat: { value: null },
    selectedFleet: { value: null },
    birthDate: { value: null },
    availableBases: { value: [] },
    availableSeats: { value: [] },
    availableFleets: { value: [] },
    realUserFound: { value: false },
    isConfigured: { value: false },
    retireDate: { value: null },
    syntheticEntry: { value: null },
    reset: mockReset,
  },
}))
mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }))

describe('SettingsNewHireModeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnabled.value = false
  })

  it('shows success toast when new hire mode is enabled', async () => {
    const Card = await import('./SettingsNewHireModeCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as any

    await vm.onToggle(true)

    expect(mockEnabled.value).toBe(true)
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'success' }),
    )
  })

  it('shows neutral toast when new hire mode is disabled', async () => {
    mockEnabled.value = true
    const Card = await import('./SettingsNewHireModeCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as any

    await vm.onToggle(false)

    expect(mockEnabled.value).toBe(false)
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.any(String) }),
    )
  })

  it('calls reset and shows success toast when reset is clicked', async () => {
    const Card = await import('./SettingsNewHireModeCard.vue')
    const wrapper = await mountSuspended(Card.default)
    const vm = wrapper.vm as any

    await vm.onReset()

    expect(mockReset).toHaveBeenCalled()
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'success' }),
    )
  })
})
