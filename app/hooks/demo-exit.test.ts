// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

const mockSeniorityStore = vi.hoisted(() => ({
  deleteDemoLists: vi.fn().mockResolvedValue(undefined),
}))

const mockUserStore = vi.hoisted(() => ({
  clearPreferences: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockSeniorityStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))

// Mock navigateTo
const mockNavigateTo = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => mockNavigateTo)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ON_DEMO_EXIT hook listener', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockSeniorityStore.deleteDemoLists.mockResolvedValue(undefined)
    mockUserStore.clearPreferences.mockResolvedValue(undefined)
  })

  it('calls deleteDemoLists on the seniority store', async () => {
    const { emitHook } = await import('~/utils/hooks')

    await emitHook('app:demo:exit')

    expect(mockSeniorityStore.deleteDemoLists).toHaveBeenCalledOnce()
  })

  it('calls clearPreferences on the user store', async () => {
    const { emitHook } = await import('~/utils/hooks')

    await emitHook('app:demo:exit')

    expect(mockUserStore.clearPreferences).toHaveBeenCalledOnce()
  })

  it('navigates to / after cleanup', async () => {
    const { emitHook } = await import('~/utils/hooks')

    await emitHook('app:demo:exit')

    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })
})
