// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ---------------------------------------------------------------------------
// Mock #app with a local handler registry for test isolation
// ---------------------------------------------------------------------------

type Handler = (...args: unknown[]) => unknown | Promise<unknown>
const runtimeHandlers = new Map<string, Handler[]>()

vi.mock('#app', async () => {
  const actual = await vi.importActual('#app')
  return {
    ...(actual as object),
    useNuxtApp: () => ({
      hook: (name: string, handler: Handler) => {
        const handlers = runtimeHandlers.get(name) ?? []
        handlers.push(handler)
        runtimeHandlers.set(name, handlers)
      },
      callHook: async (name: string, ...args: unknown[]) => {
        const handlers = runtimeHandlers.get(name) ?? []
        for (const handler of handlers) {
          await handler(...args)
        }
      },
    }),
  }
})

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
  beforeEach(async () => {
    vi.clearAllMocks()
    runtimeHandlers.clear()
    vi.resetModules()
    mockSeniorityStore.deleteDemoLists.mockResolvedValue(undefined)
    mockUserStore.clearPreferences.mockResolvedValue(undefined)

    // Import and register the hook listener with our fake nuxtApp
    const { default: registerDemoExitHook } = await import('./demo-exit')
    const { useNuxtApp } = await import('#app')
    registerDemoExitHook(useNuxtApp())
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
