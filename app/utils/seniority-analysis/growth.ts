import { diffYears } from '~/utils/date'
import type { PlainDate } from '~/utils/temporal'

/** Assumptions for modeled company growth. */
export interface GrowthAssumptions {
  enabled: boolean
  annualGrowthRate: number
}

export const DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS: GrowthAssumptions = {
  enabled: false,
  annualGrowthRate: 0.03,
}

/** Compounds a decimal annual growth rate over the elapsed date interval. */
export function calculateAdditionalSeniorityPilots(
  initialPilotCount: number,
  annualGrowthRate: number,
  from: PlainDate,
  through: PlainDate,
): number {
  const yearsElapsed = diffYears(from.toString(), through.toString())
  if (yearsElapsed <= 0 || annualGrowthRate <= 0) return 0
  return Math.round(initialPilotCount * ((1 + annualGrowthRate) ** yearsElapsed - 1))
}
