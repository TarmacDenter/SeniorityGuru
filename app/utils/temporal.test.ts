// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { Temporal, addLocalCalendarDays, parseInstant, serializeInstant, parsePlainDate, serializePlainDate } from './temporal'

describe('Temporal boundary', () => {
  it('round-trips PlainDate values as ISO dates', () => {
    const date = parsePlainDate('2024-02-29')
    expect(date).toBeInstanceOf(Temporal.PlainDate)
    expect(serializePlainDate(date)).toBe('2024-02-29')
  })

  it('rejects impossible calendar dates', () => {
    expect(() => parsePlainDate('2023-02-29')).toThrow()
  })

  it('serializes Instants at millisecond precision', () => {
    const instant = parseInstant('2026-01-15T12:34:56.789123Z')
    expect(serializeInstant(instant)).toBe('2026-01-15T12:34:56.789Z')
  })

  it('adds local calendar days to an Instant', () => {
    const start = parseInstant('2026-03-07T17:00:00Z')
    const result = addLocalCalendarDays(start, 7)
    expect(result.epochMilliseconds).not.toBe(start.epochMilliseconds)
  })
})
