// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { createScenario } from './scenario'
import { DEFAULT_GROWTH_CONFIG } from '~/utils/seniority-engine'
import { Temporal } from '~/utils/temporal'

describe('createScenario', () => {
  it('provides sensible defaults', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15'))
    const s = createScenario({ projectionDate: Temporal.PlainDate.from('2026-01-01') })
    expect(s.projectionDate.toString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(s.growthConfig).toEqual(DEFAULT_GROWTH_CONFIG)
    expect(s.scopeFilter).toEqual({}) // default is company-wide (empty QualSpec)
    vi.useRealTimers()
  })

  it('accepts overrides', () => {
    const custom = createScenario({
      projectionDate: Temporal.PlainDate.from('2030-01-01'),
      growthConfig: { enabled: true, annualRate: 0.05 },
      scopeFilter: { seat: 'CA' },
    })
    expect(custom.projectionDate.toString()).toBe('2030-01-01')
    expect(custom.growthConfig).toEqual({ enabled: true, annualRate: 0.05 })
    expect(custom.scopeFilter).toEqual({ seat: 'CA' })
  })

  it('partial overrides merge with defaults', () => {
    const partial = createScenario({ projectionDate: Temporal.PlainDate.from('2026-01-01'), growthConfig: { enabled: true, annualRate: 0.02 } })
    expect(partial.growthConfig).toEqual({ enabled: true, annualRate: 0.02 })
    expect(partial.scopeFilter).toEqual({})
  })
})
