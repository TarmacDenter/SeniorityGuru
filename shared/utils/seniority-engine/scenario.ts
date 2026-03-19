import { DEFAULT_GROWTH_CONFIG } from '#shared/types/growth-config'
import type { FilterFn } from '#shared/utils/seniority-math'
import type { Scenario, ScenarioOptions } from './types'

const PASS_ALL: FilterFn = () => true

export function createScenario(options?: ScenarioOptions): Scenario {
  return {
    projectionDate: options?.projectionDate ?? new Date(),
    growthConfig: options?.growthConfig ?? { ...DEFAULT_GROWTH_CONFIG },
    scopeFilter: options?.scopeFilter ?? PASS_ALL,
  }
}
