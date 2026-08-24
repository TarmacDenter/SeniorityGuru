// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseInstant, parsePlainDate } from '~/utils/temporal'
import { instantSortingFn, plainDateSortingFn } from './temporal-sorting'

function row(value: unknown) {
  return { getValue: () => value } as never
}

describe('Temporal table sorting', () => {
  it('sorts PlainDate values without coercing them', () => {
    expect(plainDateSortingFn(row(parsePlainDate('2026-01-02')), row(parsePlainDate('2026-01-01')), 'date')).toBeGreaterThan(0)
  })

  it('sorts Instant values without coercing them', () => {
    expect(instantSortingFn(row(parseInstant('2026-01-02T00:00:00Z')), row(parseInstant('2026-01-01T00:00:00Z')), 'createdAt')).toBeGreaterThan(0)
  })
})
