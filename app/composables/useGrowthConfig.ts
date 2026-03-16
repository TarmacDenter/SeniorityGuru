import type { GrowthConfig } from '#shared/types/growth-config'
import { DEFAULT_GROWTH_CONFIG } from '#shared/types/growth-config'

const growthConfig = ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG })

export function useGrowthConfig() {
  return { growthConfig }
}
