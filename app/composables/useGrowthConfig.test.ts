import { describe, it, expect } from 'vitest'
import { useGrowthConfig } from './useGrowthConfig'

describe('useGrowthConfig', () => {
  it('returns default config', () => {
    const { growthConfig } = useGrowthConfig()
    expect(growthConfig.value.enabled).toBe(false)
    expect(growthConfig.value.annualRate).toBe(0.03)
  })

  it('is a factory — each call returns an independent ref', () => {
    const a = useGrowthConfig()
    const b = useGrowthConfig()
    a.growthConfig.value.enabled = true
    expect(b.growthConfig.value.enabled).toBe(false)
  })
})
