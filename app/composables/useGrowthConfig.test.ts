import { describe, it, expect } from 'vitest'
import { useGrowthConfig } from './useGrowthConfig'

describe('useGrowthConfig', () => {
  it('returns default config', () => {
    const { growthConfig } = useGrowthConfig()
    expect(growthConfig.value.enabled).toBe(false)
    expect(growthConfig.value.annualRate).toBe(0.03)
  })

  it('is a singleton — mutations visible across calls', () => {
    const a = useGrowthConfig()
    const b = useGrowthConfig()
    a.growthConfig.value.enabled = true
    expect(b.growthConfig.value.enabled).toBe(true)
    // Reset for other tests
    a.growthConfig.value.enabled = false
  })
})
