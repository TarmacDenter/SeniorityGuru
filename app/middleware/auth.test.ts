import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'

// vi.hoisted runs before imports — use plain objects (not Vue refs) here
const { mockUser, mockNavigateTo, mockProfile, mockFetchProfile } = vi.hoisted(() => ({
  mockUser: { value: null as Record<string, unknown> | null },
  mockNavigateTo: vi.fn(),
  mockProfile: { value: null as Record<string, unknown> | null },
  mockFetchProfile: vi.fn(),
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    get profile() { return mockProfile.value },
    fetchProfile: mockFetchProfile,
  }),
}))

const routeTo = (path: string): RouteLocationNormalized =>
  ({ path, query: {}, hash: '', name: undefined, params: {}, matched: [], meta: {}, fullPath: path, redirectedFrom: undefined }) as unknown as RouteLocationNormalized

describe('auth middleware', async () => {
  const { default: authMiddleware } = await import('./auth')

  beforeEach(() => {
    mockUser.value = null
    mockProfile.value = null
    mockFetchProfile.mockReset()
    mockNavigateTo.mockReset()
  })

  describe('Level 1 — unauthenticated', () => {
    it('redirects to /welcome when no user', async () => {
      mockUser.value = null
      await authMiddleware(routeTo('/'), routeTo('/'))
      expect(mockNavigateTo).toHaveBeenCalledWith('/welcome')
    })
  })

  describe('Level 2 — authenticated but unverified email', () => {
    it('redirects to /auth/resend-email when email not confirmed', async () => {
      mockUser.value = { user_metadata: { email_verified: false } }
      await authMiddleware(routeTo('/'), routeTo('/'))
      expect(mockNavigateTo).toHaveBeenCalledWith('/auth/resend-email')
    })

    it('does not redirect to resend-email when navigating to an /auth/* page', async () => {
      mockUser.value = { user_metadata: { email_verified: false } }
      await authMiddleware(routeTo('/auth/resend-email'), routeTo('/auth/resend-email'))
      expect(mockNavigateTo).not.toHaveBeenCalledWith('/auth/resend-email')
    })
  })

  describe('Level 3 — verified user without airline', () => {
    it('redirects to /auth/setup-profile when icao_code is null', async () => {
      mockUser.value = { user_metadata: { email_verified: true } }
      mockProfile.value = { role: 'user', icao_code: null }
      await authMiddleware(routeTo('/'), routeTo('/'))
      expect(mockNavigateTo).toHaveBeenCalledWith('/auth/setup-profile')
    })

    it('does not redirect when navigating to /auth/setup-profile itself', async () => {
      mockUser.value = { user_metadata: { email_verified: true } }
      mockProfile.value = { role: 'user', icao_code: null }
      await authMiddleware(routeTo('/auth/setup-profile'), routeTo('/auth/setup-profile'))
      expect(mockNavigateTo).not.toHaveBeenCalledWith('/auth/setup-profile')
    })

    it('fetches profile when not already loaded', async () => {
      mockUser.value = { user_metadata: { email_verified: true } }
      mockProfile.value = null
      mockFetchProfile.mockImplementation(() => { mockProfile.value = { role: 'user', icao_code: 'UAL' } })
      await authMiddleware(routeTo('/'), routeTo('/'))
      expect(mockFetchProfile).toHaveBeenCalledOnce()
    })

    it('allows admin users through even without icao_code', async () => {
      mockUser.value = { user_metadata: { email_verified: true } }
      mockProfile.value = { role: 'admin', icao_code: null }
      await authMiddleware(routeTo('/'), routeTo('/'))
      expect(mockNavigateTo).not.toHaveBeenCalledWith('/auth/setup-profile')
    })

    it('allows verified users with icao_code through without redirecting', async () => {
      mockUser.value = { user_metadata: { email_verified: true } }
      mockProfile.value = { role: 'user', icao_code: 'UAL' }
      await authMiddleware(routeTo('/'), routeTo('/'))
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })
})
