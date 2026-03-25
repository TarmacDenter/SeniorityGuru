// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { createLogger, getLogBuffer, clearLogBuffer, exportLogAsText } from './logger'
import type { LogEntry } from './logger'

describe('logger ring buffer', () => {
  beforeEach(() => {
    clearLogBuffer()
  })

  it('captures an entry with correct fields', () => {
    const log = createLogger('test')
    log.info('hello')

    const buffer = getLogBuffer()
    expect(buffer).toHaveLength(1)

    const entry: LogEntry = buffer[0]!
    expect(entry.message).toBe('hello')
    expect(entry.scope).toBe('test')
    expect(entry.level).toBe('info')
    expect(entry.timestamp).toBeTruthy()
  })

  it('multiple loggers write to the same shared buffer', () => {
    const log1 = createLogger('scope-a')
    const log2 = createLogger('scope-b')

    log1.info('from a')
    log2.warn('from b')

    const buffer = getLogBuffer()
    expect(buffer).toHaveLength(2)
    expect(buffer[0]!.scope).toBe('scope-a')
    expect(buffer[1]!.scope).toBe('scope-b')
  })

  it('caps the buffer at 500 entries, dropping the oldest', () => {
    const log = createLogger('bulk')
    for (let i = 0; i < 510; i++) {
      log.info(`msg-${i}`)
    }

    const buffer = getLogBuffer()
    expect(buffer.length).toBeLessThanOrEqual(500)
    // oldest entries (0-9) should be dropped, first entry should be msg-10
    expect(buffer[0]!.message).toBe('msg-10')
    expect(buffer[buffer.length - 1]!.message).toBe('msg-509')
  })

  it('clearLogBuffer empties the buffer', () => {
    const log = createLogger('test')
    log.info('something')
    expect(getLogBuffer()).toHaveLength(1)

    clearLogBuffer()
    expect(getLogBuffer()).toHaveLength(0)
  })

  it('exportLogAsText returns formatted string with level, scope, message, and data', () => {
    const log = createLogger('upload')
    log.error('parse failed', { file: 'test.csv' })

    const text = exportLogAsText()
    expect(text).toContain('[ERROR]')
    expect(text).toContain('[upload]')
    expect(text).toContain('parse failed')
    expect(text).toContain('"file"')
    expect(text).toContain('"test.csv"')
  })

  it('getLogBuffer returns a copy that does not affect internal state', () => {
    const log = createLogger('test')
    log.info('original')

    const copy = getLogBuffer()
    copy.push({ level: 'debug', scope: 'fake', message: 'injected', timestamp: '' })

    expect(getLogBuffer()).toHaveLength(1)
    expect(getLogBuffer()[0]!.message).toBe('original')
  })
})
