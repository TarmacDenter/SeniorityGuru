import { describe, it, expect, vi } from 'vitest'

const mockSeniorityStore = vi.hoisted(() => ({
  clearAll: vi.fn(),
}))
const mockUserStore = vi.hoisted(() => ({
  clearPreferences: vi.fn(),
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockSeniorityStore,
}))
vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

describe('useClearAllData', () => {
  it('calls seniorityStore.clearAll() and userStore.clearPreferences()', async () => {
    mockSeniorityStore.clearAll.mockResolvedValue(undefined)
    mockUserStore.clearPreferences.mockResolvedValue(undefined)

    const { useClearAllData } = await import('./useClearAllData')
    const { clearAllData } = useClearAllData()

    await clearAllData()

    expect(mockSeniorityStore.clearAll).toHaveBeenCalled()
    expect(mockUserStore.clearPreferences).toHaveBeenCalled()
  })
})
