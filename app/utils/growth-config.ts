import type { QualSpec } from '~/utils/seniority-engine/qual-spec'
import { diffYears } from '~/utils/date'

export interface GrowthConfig {
  enabled: boolean
  annualRate: number // 0.005 to 0.10 (0.5% to 10%), step 0.005
  qualOverrides?: { spec: QualSpec; rate: number }[]
}

export const DEFAULT_GROWTH_CONFIG: GrowthConfig = {
  enabled: false,
  annualRate: 0.03, // 3% default when first enabled
}

/** Compound growth: `round(initialTotal * ((1 + rate)^yearsElapsed - 1))`. Returns 0 for negative elapsed time or zero rate. */
export function computeAdditionalPilots(
  initialTotal: number,
  annualRate: number,
  baseDate: string,
  targetDate: string,
): number {
  const yearsElapsed = diffYears(baseDate, targetDate)
  if (yearsElapsed <= 0 || annualRate <= 0) return 0
  return Math.round(initialTotal * ((1 + annualRate) ** yearsElapsed - 1))
}
