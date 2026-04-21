// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Handler = (...args: unknown[]) => unknown | Promise<unknown>
const runtimeHandlers = new Map<string, Handler[]>()

vi.mock('#app', () => ({
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
}))

// Re-import fresh module each test to avoid cached state leakage.
async function freshHooks() {
  vi.resetModules()
  return import('./hooks')
}

describe('emitHook / defineHook (Nuxt runtime hooks)', () => {
  beforeEach(() => {
    runtimeHandlers.clear()
  })

  it('calls a registered handler when event is emitted', async () => {
    const { emitHook, defineHook } = await freshHooks()
    const handler = vi.fn()
    defineHook('app:demo:enter', handler)

    await emitHook('app:demo:enter')

    expect(handler).toHaveBeenCalledOnce()
  })

  it('awaits async handlers before resolving', async () => {
    const { emitHook, defineHook } = await freshHooks()
    const order: number[] = []
    defineHook('app:demo:enter', async () => {
      await new Promise((r) => setTimeout(r, 10))
      order.push(1)
    })

    await emitHook('app:demo:enter')
    order.push(2)

    expect(order).toEqual([1, 2])
  })

  it('calls all registered handlers for an event', async () => {
    const { emitHook, defineHook } = await freshHooks()
    const callCount = { n: 0 }
    defineHook('app:demo:exit', () => { callCount.n++ })
    defineHook('app:demo:exit', () => { callCount.n++ })

    await emitHook('app:demo:exit')

    expect(callCount.n).toBe(2)
  })

  it('does not throw when no handlers are registered for an event', async () => {
    const { emitHook } = await freshHooks()
    await expect(emitHook('app:demo:exit')).resolves.toBeUndefined()
  })
})
