import type { GrowthConfig } from '~/utils/growth-config'
import { DEFAULT_GROWTH_CONFIG } from '~/utils/growth-config'

export function useGrowthConfig() {
  return { growthConfig: ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG }) }
}
