// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parsers, parserOptions, getParser } from './registry'

describe('parser registry', () => {
  it('contains the generic parser', () => {
    expect(parsers.length).toBeGreaterThanOrEqual(1)
    expect(parsers.some(p => p.id === 'generic')).toBe(true)
  })

  it('getParser returns the correct parser by id', () => {
    const generic = getParser('generic')
    expect(generic.id).toBe('generic')
  })

  it('getParser falls back to generic for unknown id', () => {
    const fallback = getParser('nonexistent-airline')
    expect(fallback.id).toBe('generic')
  })

  it('parserOptions has correct shape', () => {
    expect(parserOptions.length).toBe(parsers.length)
    for (const opt of parserOptions) {
      expect(opt).toHaveProperty('label')
      expect(opt).toHaveProperty('value')
      expect(opt).toHaveProperty('description')
      expect(typeof opt.label).toBe('string')
      expect(typeof opt.value).toBe('string')
    }
  })

  it('generic parser is last in the list', () => {
    const last = parsers[parsers.length - 1]
    expect(last?.id).toBe('generic')
  })

  it('getParser returns delta parser by id', () => {
    const delta = getParser('delta')
    expect(delta.id).toBe('delta')
  })

  it('delta parser is before generic in the list', () => {
    const deltaIdx = parsers.findIndex(p => p.id === 'delta')
    const genericIdx = parsers.findIndex(p => p.id === 'generic')
    expect(deltaIdx).toBeLessThan(genericIdx)
  })
})
