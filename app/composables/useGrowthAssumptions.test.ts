import { describe, it, expect } from 'vitest'
import { useGrowthAssumptions } from './useGrowthAssumptions'

describe('useGrowthAssumptions', () => {
  it('returns default config', () => {
    const { growthAssumptions } = useGrowthAssumptions()
    expect(growthAssumptions.value.enabled).toBe(false)
    expect(growthAssumptions.value.annualGrowthRate).toBe(0.03)
  })

  it('is a factory — each call returns an independent ref', () => {
    const a = useGrowthAssumptions()
    const b = useGrowthAssumptions()
    a.growthAssumptions.value.enabled = true
    expect(b.growthAssumptions.value.enabled).toBe(false)
  })
})
