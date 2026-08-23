import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS } from '~/utils/seniority-analysis/growth'
import type { Scenario, ScenarioOptions } from './types'

/**
 * Creates a normalized calculation scenario with default growth and a
 * company-wide qualification scope when those options are omitted.
 */
export function createSeniorityScenario(options: ScenarioOptions = {}): Scenario {
  return {
    growthAssumptions: options.growthAssumptions ?? { ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS },
    qualificationScope: options.qualificationScope ?? {},
  }
}
