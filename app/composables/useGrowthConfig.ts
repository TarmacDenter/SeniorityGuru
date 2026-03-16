import type { GrowthConfig } from '#shared/types/growth-config'
import { DEFAULT_GROWTH_CONFIG } from '#shared/types/growth-config'

export function useGrowthConfig() {
  return { growthConfig: ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG }) }
}
