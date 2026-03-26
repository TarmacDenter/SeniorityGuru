import { DEFAULT_GROWTH_CONFIG } from '~/utils/growth-config'
import { todayISO } from '~/utils/date'
import type { Scenario, ScenarioOptions } from './types'

export function createScenario(options?: ScenarioOptions): Scenario {
  return {
    projectionDate: options?.projectionDate ?? todayISO(),
    growthConfig: options?.growthConfig ?? { ...DEFAULT_GROWTH_CONFIG },
    scopeFilter: options?.scopeFilter ?? {},
  }
}
