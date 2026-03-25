// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { stableStringify, memoizeLast } from './memoize'

describe('stableStringify', () => {
  it('produces identical output regardless of key insertion order', () => {
    const a = { z: 1, a: 2 }
    const b = { a: 2, z: 1 }
    expect(stableStringify(a)).toBe(stableStringify(b))
  })

  it('handles nested objects', () => {
    const a = { outer: { z: 1, a: 2 }, x: 3 }
    const b = { x: 3, outer: { a: 2, z: 1 } }
    expect(stableStringify(a)).toBe(stableStringify(b))
  })

  it('handles arrays (order preserved)', () => {
    expect(stableStringify([1, 2, 3])).toBe(stableStringify([1, 2, 3]))
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]))
  })

  it('handles primitives', () => {
    expect(stableStringify(42)).toBe('42')
    expect(stableStringify('hello')).toBe('"hello"')
    expect(stableStringify(null)).toBe('null')
    expect(stableStringify(true)).toBe('true')
  })

  it('serializes Date objects by ISO string value', () => {
    const d1 = new Date('2026-01-01')
    const d2 = new Date('2030-06-15')
    expect(stableStringify(d1)).not.toBe(stableStringify(d2))
    expect(stableStringify(d1)).toBe(stableStringify(new Date('2026-01-01')))
  })

  it('distinguishes objects containing different Dates', () => {
    const a = { projectionDate: new Date('2026-01-01'), name: 'x' }
    const b = { projectionDate: new Date('2030-01-01'), name: 'x' }
    expect(stableStringify(a)).not.toBe(stableStringify(b))
  })
})

describe('memoizeLast', () => {
  it('returns cached result on same args (referential equality)', () => {
    const fn = vi.fn((x: number) => ({ value: x * 2 }))
    const memoized = memoizeLast(fn)

    const first = memoized(5)
    const second = memoized(5)

    expect(first).toBe(second) // same reference
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('recomputes when args change', () => {
    const fn = vi.fn((x: number) => ({ value: x * 2 }))
    const memoized = memoizeLast(fn)

    const first = memoized(5)
    const second = memoized(10)

    expect(first).not.toBe(second)
    expect(first.value).toBe(10)
    expect(second.value).toBe(20)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('replaces cache on new args (last-one-wins)', () => {
    const fn = vi.fn((x: number) => ({ value: x }))
    const memoized = memoizeLast(fn)

    memoized(1) // compute
    memoized(2) // compute (replaces cache)
    memoized(1) // compute again (cache was replaced)

    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('works with object args using stable key (different property order = cache hit)', () => {
    const fn = vi.fn((opts: { a: number; b: string }) => ({ result: opts.a }))
    const memoized = memoizeLast(fn)

    const first = memoized({ a: 1, b: 'x' })
    const second = memoized({ b: 'x', a: 1 })

    expect(first).toBe(second) // same reference — stable key treats reordered object as same
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('supports custom keyFn override', () => {
    const fn = vi.fn(() => ({ standing: true }))
    const memoized = memoizeLast(fn, () => 'standing')

    const first = memoized()
    const second = memoized()

    expect(first).toBe(second)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('recomputes with custom keyFn when key changes', () => {
    let counter = 0
    const fn = vi.fn(() => ({ value: ++counter }))
    const memoized = memoizeLast(fn, (..._args: unknown[]) => `key-${counter}`)

    const first = memoized() // key-0 -> computes, counter becomes 1
    // Now the key function returns key-1 which differs from cached key-0
    const second = memoized() // key-1 -> computes, counter becomes 2

    expect(first).not.toBe(second)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('works with multiple arguments', () => {
    const fn = vi.fn((a: number, b: string) => ({ a, b }))
    const memoized = memoizeLast(fn)

    const first = memoized(1, 'hello')
    const second = memoized(1, 'hello')
    const third = memoized(1, 'world')

    expect(first).toBe(second)
    expect(first).not.toBe(third)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
