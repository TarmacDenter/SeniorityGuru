import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED'

// Capture the callback that the plugin registers with onAuthStateChange.
// Nuxt's test environment auto-discovers and runs plugins on boot,
// so capturedCallback is populated before any test runs.
let capturedCallback: ((event: AuthChangeEvent) => void) | undefined

const { mockOnAuthStateChange } = vi.hoisted(() => ({
  mockOnAuthStateChange: vi.fn((cb: (event: AuthChangeEvent) => void) => {
    capturedCallback = cb
  }),
}))

mockNuxtImport('useSupabaseClient', () => () => ({
  auth: { onAuthStateChange: mockOnAuthStateChange },
}))

const mockClearProfile = vi.fn()
const mockFetchProfile = vi.fn()
const mockClearStore = vi.fn()

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    clearProfile: mockClearProfile,
    fetchProfile: mockFetchProfile,
  }),
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => ({
    clearStore: mockClearStore,
  }),
}))

describe('plugins/auth-sync', () => {
  beforeEach(() => {
    mockClearProfile.mockReset()
    mockFetchProfile.mockReset()
    mockClearStore.mockReset()
  })

  it('registers an auth state change listener on boot', () => {
    expect(mockOnAuthStateChange).toHaveBeenCalled()
    expect(capturedCallback).toBeTypeOf('function')
  })

  it('clears user profile and seniority store on SIGNED_OUT', () => {
    capturedCallback!('SIGNED_OUT')

    expect(mockClearProfile).toHaveBeenCalledOnce()
    expect(mockClearStore).toHaveBeenCalledOnce()
  })

  // Regression: seniority store was not cleared on SIGNED_OUT, leaving stale data across sessions
  it('clears seniority store on SIGNED_OUT (regression)', () => {
    capturedCallback!('SIGNED_OUT')

    expect(mockClearStore).toHaveBeenCalledOnce()
  })

  it('refreshes user profile on SIGNED_IN', () => {
    capturedCallback!('SIGNED_IN')

    expect(mockFetchProfile).toHaveBeenCalledOnce()
    expect(mockClearStore).not.toHaveBeenCalled()
  })

  it('refreshes user profile on TOKEN_REFRESHED', () => {
    capturedCallback!('TOKEN_REFRESHED')

    expect(mockFetchProfile).toHaveBeenCalledOnce()
    expect(mockClearStore).not.toHaveBeenCalled()
  })
})
