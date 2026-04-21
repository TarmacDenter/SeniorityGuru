// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

const mockSeniorityStore = vi.hoisted(() => ({
  fetchLists: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockSeniorityStore }))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('list:changed hook listener', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockSeniorityStore.fetchLists.mockResolvedValue(undefined)
  })

  it('calls fetchLists on the seniority store when list:changed fires', async () => {
    const { emitHook } = await import('~/utils/hooks')
    await import('./list-changed')

    await emitHook('list:changed')

    expect(mockSeniorityStore.fetchLists).toHaveBeenCalledOnce()
  })
})
