import { DEFAULT_GROWTH_CONFIG } from '~/utils/growth-config'
import type { Scenario, ScenarioOptions } from './types'

/**
 * Creates a normalized calculation scenario with default growth and a
 * company-wide qualification scope when those options are omitted.
 */
export function createScenario(options: ScenarioOptions): Scenario {
  return {
    projectionDate: options.projectionDate,
    growthConfig: options.growthConfig ?? { ...DEFAULT_GROWTH_CONFIG },
    scopeFilter: options.scopeFilter ?? {},
  }
}
