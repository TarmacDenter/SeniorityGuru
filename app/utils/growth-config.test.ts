// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computeAdditionalPilots, DEFAULT_GROWTH_CONFIG } from './growth-config'

describe('DEFAULT_GROWTH_CONFIG', () => {
  it('starts disabled with 3% annual rate', () => {
    expect(DEFAULT_GROWTH_CONFIG.enabled).toBe(false)
    expect(DEFAULT_GROWTH_CONFIG.annualRate).toBe(0.03)
  })
})

describe('computeAdditionalPilots', () => {
  it('computes correct value for 2000 pilots at 3% over 5 years', () => {
    // 2000 * ((1.03)^5 - 1) = 2000 * 0.15927… ≈ 319
    const result = computeAdditionalPilots(
      2000, 0.03,
      new Date('2026-01-01'), new Date('2031-01-01'),
    )
    expect(result).toBe(319)
  })

  it('computes correct value for 1000 pilots at 5% over 10 years', () => {
    // 1000 * ((1.05)^10 - 1) = 1000 * 0.6289… ≈ 629
    const result = computeAdditionalPilots(
      1000, 0.05,
      new Date('2026-01-01'), new Date('2036-01-01'),
    )
    expect(result).toBe(629)
  })

  it('returns 0 when elapsed time is 0', () => {
    const d = new Date('2026-01-01')
    expect(computeAdditionalPilots(2000, 0.03, d, d)).toBe(0)
  })

  it('returns 0 when rate is 0', () => {
    expect(computeAdditionalPilots(2000, 0,
      new Date('2026-01-01'), new Date('2031-01-01'),
    )).toBe(0)
  })

  it('returns 0 when target is before base (negative elapsed)', () => {
    expect(computeAdditionalPilots(2000, 0.03,
      new Date('2031-01-01'), new Date('2026-01-01'),
    )).toBe(0)
  })

  it('handles fractional years correctly', () => {
    // ~2.5 years: 2000 * ((1.03)^2.5 - 1) ≈ 153
    const result = computeAdditionalPilots(
      2000, 0.03,
      new Date('2026-01-01'), new Date('2028-07-02'),
    )
    expect(result).toBeGreaterThan(140)
    expect(result).toBeLessThan(165)
  })

  it('scales with initial total', () => {
    const base = new Date('2026-01-01')
    const target = new Date('2031-01-01')
    const small = computeAdditionalPilots(100, 0.03, base, target)
    const large = computeAdditionalPilots(10000, 0.03, base, target)
    expect(large / small).toBeCloseTo(100, 0)
  })
})
