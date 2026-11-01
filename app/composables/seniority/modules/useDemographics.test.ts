// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
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
  it('counts the matching pilots and narrows them with the Qualification filter', async () => {
    seed()
    const demographics = useDemographics()
    expect(demographics.matchingPilotCount.value).toBe(3)
    expect(demographics.qualificationLabel.value).toBe('')

    demographics.filter.selectedBase.value = 'JFK'
    await nextTick()

    expect(demographics.matchingPilotCount.value).toBe(2)
    expect(demographics.qualificationComposition.value.map(row => row.qualificationLabel)).toEqual(['737 CA'])
    expect(demographics.qualificationLabel.value).toContain('JFK')
  })

  it('exposes distributions and the Anchor Pilot years of service', () => {
    seed()
    mockUserStore.employeeNumber = 'E1'
    const demographics = useDemographics()

    expect(demographics.ageDistribution.value.buckets).toBeDefined()
    expect(demographics.yearsOfServiceBuckets.value.length).toBeGreaterThan(0)
    expect(demographics.userYos.value).toBeGreaterThan(10)
    expect(demographics.hasResult.value).toBe(true)
  })

  it('has no result and no years of service before a list is loaded', () => {
    const demographics = useDemographics()
    expect(demographics.hasResult.value).toBe(false)
    expect(demographics.matchingPilotCount.value).toBe(0)
    expect(demographics.userYos.value).toBeUndefined()
  })
})
