import { DEFAULT_GROWTH_CONFIG } from '~/utils/growth-config'
import type { Scenario, ScenarioOptions } from './types'

export function createScenario(options?: ScenarioOptions): Scenario {
  return {
    projectionDate: options?.projectionDate ?? new Date(),
    growthConfig: options?.growthConfig ?? { ...DEFAULT_GROWTH_CONFIG },
    scopeFilter: options?.scopeFilter ?? {},
  }
}
