// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Re-import fresh module each test to avoid registry state leakage
async function freshHooks() {
  vi.resetModules()
  return import('./hooks')
}

describe('emitHook / defineHook', () => {
  beforeEach(() => {
    vi.resetModules()
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
