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
  addList: vi.fn().mockResolvedValue(1),
}))

const mockUserStore = vi.hoisted(() => ({
  savePreference: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockSeniorityStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))

// Mock demo CSV assets so tests don't depend on the real 3000-row files
vi.mock('~/utils/demo-assets', () => ({
  demoDataCSV: 'SEN,CMID,NAME,BASE,FLEET,SEAT,HIREDATE,RTRDATE\n1,1841,"TILLMAN, Joan",BOS,320,CA,7/16/1999,11/1/2059',
  demoDataV2CSV: 'SEN,CMID,NAME,BASE,FLEET,SEAT,HIREDATE,RTRDATE\n1,1841,"TILLMAN, Joan",BOS,320,CA,7/16/1999,11/1/2059\n2,5000,"NOVAK, Jordan",JFK,320,FO,4/15/2018,7/1/2060',
}))

// Mock navigateTo
const mockNavigateTo = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => mockNavigateTo)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ON_DEMO_ENTER hook listener', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    runtimeHandlers.clear()
    vi.resetModules()
    mockSeniorityStore.addList.mockResolvedValue(1)
    mockUserStore.savePreference.mockResolvedValue(undefined)

    // Import and register the hook listener with our fake nuxtApp
    const { default: registerDemoEnterHook } = await import('./demo-enter')
    const { useNuxtApp } = await import('#app')
    registerDemoEnterHook(useNuxtApp())
  })

  it('calls addList twice (base list + variant list) with isDemo: true', async () => {
    const { emitHook } = await import('~/utils/hooks')

    await emitHook('app:demo:enter')

    expect(mockSeniorityStore.addList).toHaveBeenCalledTimes(2)
    expect(mockSeniorityStore.addList).toHaveBeenCalledWith(
      expect.objectContaining({ isDemo: true }),
      expect.any(Array),
    )
  })

  it('sets employee number to DEMO_EMPLOYEE_NUMBER after entering demo', async () => {
    const { emitHook } = await import('~/utils/hooks')

    await emitHook('app:demo:enter')

    expect(mockUserStore.savePreference).toHaveBeenCalledWith('employeeNumber', '1371')
  })

  it('navigates to /dashboard after setup', async () => {
    const { emitHook } = await import('~/utils/hooks')

    await emitHook('app:demo:enter')

    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })
})
