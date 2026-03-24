// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockNavigateTo, mockIsStandalone } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockIsStandalone: vi.fn(() => false),
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('~/utils/pwa-standalone', () => ({
  isStandaloneMode: mockIsStandalone,
}))

describe('pwa-redirect middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects / to /dashboard in standalone mode', async () => {
    mockIsStandalone.mockReturnValue(true)
    const { default: middleware } = await import('./pwa-redirect.global')
    middleware({ path: '/' } as any, undefined as any)
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('does not redirect /dashboard in standalone mode', async () => {
    mockIsStandalone.mockReturnValue(true)
    const { default: middleware } = await import('./pwa-redirect.global')
    middleware({ path: '/dashboard' } as any, undefined as any)
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('does not redirect /settings in standalone mode', async () => {
    mockIsStandalone.mockReturnValue(true)
    const { default: middleware } = await import('./pwa-redirect.global')
    middleware({ path: '/settings' } as any, undefined as any)
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('does not redirect / in browser mode', async () => {
    mockIsStandalone.mockReturnValue(false)
    const { default: middleware } = await import('./pwa-redirect.global')
    middleware({ path: '/' } as any, undefined as any)
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
