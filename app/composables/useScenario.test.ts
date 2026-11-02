import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _resetCoreSingletons } from '~/composables/seniority/modules/useSeniorityCore'
import { useScenario } from '~/composables/useScenario'
import { resetMockStores } from '~/test-utils/seniority-mocks'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  const { scopeLabel, growthAssumptions } = useScenario()
  scopeLabel.value = 'Company-wide'
  growthAssumptions.value = { enabled: false, annualGrowthRate: 0.02 }
})

describe('useScenario', () => {
  it('shares one scope and one set of Growth Assumptions between callers', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'FO', fleet: '320' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'BOS', seat: 'CA', fleet: '220' }),
    ]
    const strip = useScenario()
    const panel = useScenario()

    strip.scopeLabel.value = 'JFK FO 320'
    expect(panel.qualificationScope.value).toEqual({ base: 'JFK', seat: 'FO', fleet: '320' })

    strip.growthAssumptions.value = { enabled: true, annualGrowthRate: 0.035 }
    expect(panel.growthLabel.value).toBe('3.5% annual growth')
  })

  it('falls back to company-wide for an unknown scope', () => {
    const scenario = useScenario()
    scenario.scopeLabel.value = 'Nowhere'
    expect(scenario.qualificationScope.value).toEqual({})
    expect(scenario.growthLabel.value).toBe('Retirements only')
  })
})
