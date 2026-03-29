import { DEFAULT_GROWTH_CONFIG, type GrowthConfig } from '~/utils/seniority-engine'

export function useGrowthConfig() {
  return { growthConfig: ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG }) }
}
