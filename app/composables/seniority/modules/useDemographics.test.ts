// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'
import type { QualificationScope } from '~/utils/seniority'
import { useDemographics } from './useDemographics'
import { useSeniorityCore, _resetCoreSingletons } from './useSeniorityCore'
import { resetMockStores } from '~/test-utils/seniority-mocks'

const mockStore = vi.hoisted(() => {
  const { reactive } = require('vue')
  return reactive({ entries: [] as any[], lists: [] as any[] })
})
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
})

function seed() {
  mockStore.entries = [
    makeEntry({ employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    makeEntry({ employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    makeEntry({ employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2050-01-01' }),
  ]
}

describe('useDemographics', () => {
  it('follows the Qualification Scope it is given, including a fleet, seat or base alone', async () => {
    seed()
    const scope = ref<QualificationScope>({})
    const demographics = useDemographics(scope)
    expect(demographics.matchingPilotCount.value).toBe(3)

    scope.value = { base: 'JFK' }
    await nextTick()
    expect(demographics.matchingPilotCount.value).toBe(2)
    expect(demographics.qualificationComposition.value.map(row => row.qualificationLabel)).toEqual(['737 CA'])

    scope.value = { seat: 'FO' }
    await nextTick()
    expect(demographics.qualificationComposition.value.map(row => row.qualificationLabel)).toEqual(['777 FO'])

    scope.value = { fleet: '737' }
    await nextTick()
    expect(demographics.matchingPilotCount.value).toBe(2)
  })

  it('lists sizes by seat, then fleet, then base, with ready-to-render counts', () => {
    const retire_date = '2050-01-01'
    mockStore.entries = [
      makeEntry({ employee_number: 'E1', base: 'LAX', seat: 'FO', fleet: '777', retire_date }),
      makeEntry({ employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date }),
      makeEntry({ employee_number: 'E3', base: 'ATL', seat: 'CA', fleet: '737', retire_date }),
      makeEntry({ employee_number: 'E4', base: 'JFK', seat: 'CA', fleet: '320', retire_date }),
      makeEntry({ employee_number: 'E5', base: 'JFK', seat: 'CA', fleet: '737', retire_date }),
    ]
    const { qualificationSizes } = useDemographics(ref({}))
    expect(qualificationSizes.value.map(row => [row.fleet, row.seat, row.base, row.countLabel])).toEqual([
      ['320', 'CA', 'JFK', '1'],
      ['737', 'CA', 'ATL', '1'],
      ['737', 'CA', 'JFK', '2'],
      ['777', 'FO', 'LAX', '1'],
    ])
  })

  it('works without an Anchor Pilot', () => {
    seed()
    const demographics = useDemographics(ref({}))
    expect(demographics.hasResult.value).toBe(true)
    expect(demographics.matchingPilotCount.value).toBe(3)
    expect(demographics.hasYearsOfService.value).toBe(true)
    expect(demographics.userYos.value).toBeUndefined()
  })

  it('exposes distributions and the Anchor Pilot years of service', () => {
    seed()
    mockUserStore.employeeNumber = 'E1'
    const demographics = useDemographics(ref({}))

    expect(demographics.ageDistribution.value.buckets).toBeDefined()
    expect(demographics.yearsOfServiceBuckets.value.length).toBeGreaterThan(0)
    expect(demographics.userYos.value).toBeGreaterThan(10)
    expect(demographics.hasResult.value).toBe(true)
  })

  it('has no result and no years of service before a list is loaded', () => {
    const demographics = useDemographics(ref({}))
    expect(demographics.hasResult.value).toBe(false)
    expect(demographics.matchingPilotCount.value).toBe(0)
    expect(demographics.hasYearsOfService.value).toBe(false)
    expect(demographics.userYos.value).toBeUndefined()
  })
})
