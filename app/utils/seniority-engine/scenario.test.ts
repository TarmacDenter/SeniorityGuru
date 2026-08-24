// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS } from '~/utils/seniority-analysis/growth'
import { createSeniorityScenario } from './scenario'

describe('createSeniorityScenario', () => {
  it('defaults to company-wide scope and disabled default Growth Assumptions', () => {
    const scenario = createSeniorityScenario()

    expect(scenario).toEqual({
      growthAssumptions: DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS,
      qualificationScope: {},
    })
  })

  it('contains assumptions and Qualification Scope without a projection date', () => {
    const scenario = createSeniorityScenario({
      growthAssumptions: { enabled: true, annualGrowthRate: 0.05 },
      qualificationScope: { base: 'JFK', seat: 'CA', fleet: '737' },
    })

    expect(scenario).toEqual({
      growthAssumptions: { enabled: true, annualGrowthRate: 0.05 },
      qualificationScope: { base: 'JFK', seat: 'CA', fleet: '737' },
    })
    expect(scenario).not.toHaveProperty('projectionDate')
    expect(scenario).not.toHaveProperty('projectionThroughDate')
    expect(scenario.growthAssumptions).not.toHaveProperty('qualOverrides')
  })
})
