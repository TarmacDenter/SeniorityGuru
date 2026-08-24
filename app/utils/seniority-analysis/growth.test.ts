// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parsePlainDate } from '~/utils/temporal'
import {
  calculateAdditionalSeniorityPilots,
  DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS,
} from './growth'

const date = (value: string) => parsePlainDate(value)

describe('DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS', () => {
  it('starts disabled with a decimal 3% annual rate', () => {
    expect(DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS).toEqual({
      enabled: false,
      annualGrowthRate: 0.03,
    })
  })
})

describe('calculateAdditionalSeniorityPilots', () => {
  it('preserves the five-year compound-growth formula', () => {
    expect(calculateAdditionalSeniorityPilots(
      2000,
      0.03,
      date('2026-01-01'),
      date('2031-01-01'),
    )).toBe(319)
  })

  it('preserves the ten-year compound-growth formula', () => {
    expect(calculateAdditionalSeniorityPilots(
      1000,
      0.05,
      date('2026-01-01'),
      date('2036-01-01'),
    )).toBe(629)
  })

  it.each([
    { description: 'zero elapsed time', rate: 0.03, from: '2026-01-01', through: '2026-01-01' },
    { description: 'a zero annual rate', rate: 0, from: '2026-01-01', through: '2031-01-01' },
    { description: 'a through date before from', rate: 0.03, from: '2031-01-01', through: '2026-01-01' },
  ])('returns zero for $description', ({ rate, from, through }) => {
    expect(calculateAdditionalSeniorityPilots(2000, rate, date(from), date(through))).toBe(0)
  })

  it('handles fractional years', () => {
    const result = calculateAdditionalSeniorityPilots(
      2000,
      0.03,
      date('2026-01-01'),
      date('2028-07-02'),
    )

    expect(result).toBeGreaterThan(140)
    expect(result).toBeLessThan(165)
  })

  it('scales with the initial pilot count', () => {
    const from = date('2026-01-01')
    const through = date('2031-01-01')
    const small = calculateAdditionalSeniorityPilots(100, 0.03, from, through)
    const large = calculateAdditionalSeniorityPilots(10000, 0.03, from, through)

    expect(large / small).toBeCloseTo(100, 0)
  })
})
