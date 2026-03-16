import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'

const { mockNavigateTo, mockProfile, mockFetchProfile, mockIsAdmin } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockProfile: { value: null as Record<string, unknown> | null },
  mockFetchProfile: vi.fn(),
  mockIsAdmin: { value: false },
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    get profile() { return mockProfile.value },
    get isAdmin() { return mockIsAdmin.value },
    fetchProfile: mockFetchProfile,
  }),
}))

const routeTo = (path: string): RouteLocationNormalized =>
  ({ path, query: {}, hash: '', name: undefined, params: {}, matched: [], meta: {}, fullPath: path, redirectedFrom: undefined }) as unknown as RouteLocationNormalized

describe('admin middleware', async () => {
  const { default: adminMiddleware } = await import('./admin')

  beforeEach(() => {
    mockProfile.value = null
    mockIsAdmin.value = false
    mockFetchProfile.mockReset()
    mockNavigateTo.mockReset()
  })

  it('redirects non-admin users to /dashboard', async () => {
    mockProfile.value = { role: 'user' }
    mockIsAdmin.value = false
    await adminMiddleware(routeTo('/admin/users'), routeTo('/dashboard'))
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('allows admin users through', async () => {
    mockProfile.value = { role: 'admin' }
    mockIsAdmin.value = true
    await adminMiddleware(routeTo('/admin/users'), routeTo('/'))
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('fetches profile if not loaded', async () => {
    mockProfile.value = null
    mockIsAdmin.value = false
    await adminMiddleware(routeTo('/admin/users'), routeTo('/'))
    expect(mockFetchProfile).toHaveBeenCalled()
  })
})
