import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, type GrowthAssumptions } from '~/utils/seniority'

export function useGrowthAssumptions() {
  return { growthAssumptions: ref<GrowthAssumptions>({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS }) }
}
