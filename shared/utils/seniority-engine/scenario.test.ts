// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { createScenario } from './scenario'
import { DEFAULT_GROWTH_CONFIG } from '#shared/types/growth-config'

describe('createScenario', () => {
  it('provides sensible defaults', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15'))
    const s = createScenario()
    expect(s.projectionDate).toEqual(new Date('2026-06-15'))
    expect(s.growthConfig).toEqual(DEFAULT_GROWTH_CONFIG)
    expect(s.scopeFilter).toEqual({}) // default is company-wide (empty QualSpec)
    vi.useRealTimers()
  })

  it('accepts overrides', () => {
    const custom = createScenario({
      projectionDate: new Date('2030-01-01'),
      growthConfig: { enabled: true, annualRate: 0.05 },
      scopeFilter: { seat: 'CA' },
    })
    expect(custom.projectionDate).toEqual(new Date('2030-01-01'))
    expect(custom.growthConfig).toEqual({ enabled: true, annualRate: 0.05 })
    expect(custom.scopeFilter).toEqual({ seat: 'CA' })
  })

  it('partial overrides merge with defaults', () => {
    const partial = createScenario({ growthConfig: { enabled: true, annualRate: 0.02 } })
    expect(partial.growthConfig).toEqual({ enabled: true, annualRate: 0.02 })
    // projectionDate and scopeFilter use defaults
    expect(partial.scopeFilter).toEqual({})
  })
})
