// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('isStandaloneMode', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when display-mode: standalone matches', async () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    })
    vi.stubGlobal('navigator', {})
    const { isStandaloneMode } = await import('./pwa-standalone')
    expect(isStandaloneMode()).toBe(true)
  })

  it('returns true when navigator.standalone is true (iOS)', async () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    })
    vi.stubGlobal('navigator', { standalone: true })
    const { isStandaloneMode } = await import('./pwa-standalone')
    expect(isStandaloneMode()).toBe(true)
  })

  it('returns false when neither condition is met', async () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    })
    vi.stubGlobal('navigator', {})
    const { isStandaloneMode } = await import('./pwa-standalone')
    expect(isStandaloneMode()).toBe(false)
  })
})
