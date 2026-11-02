// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useQualificationPositions } from './useQualificationPositions'
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

function seed(anchorRetire = '2050-01-01') {
  mockStore.entries = [
    makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2028-01-01' }),
    makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: anchorRetire }),
    makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2050-01-01' }),
  ]
  mockUserStore.employeeNumber = 'E2'
}

describe('useQualificationPositions', () => {
  it('lists the Anchor Pilot position in every Qualification', () => {
    seed()
    const positions = useQualificationPositions()
    expect(positions.positions.value.map(p => `${p.qualification.base} ${p.qualification.fleet}`).sort()).toEqual(['JFK 737', 'LAX 777'])
    expect(positions.noResultLabel.value).toBeNull()
    expect(positions.projectionLabel.value).toBe('As of today')
  })

  it('projects forward by the chosen years and labels the date', async () => {
    seed()
    const positions = useQualificationPositions()
    expect(positions.sliderMax.value).toBeGreaterThan(1)

    positions.projectForward.value = true
    positions.years.value = 3
    await nextTick()

    expect(positions.projectionYears.value).toBe(3)
    expect(positions.projectionLabel.value).toMatch(/^As of \d{4}-\d{2}-\d{2}$/)
  })

  it('says why there are no positions when the Anchor Pilot has retired', () => {
    seed('2020-01-01')
    const positions = useQualificationPositions()
    expect(positions.positions.value).toEqual([])
    expect(positions.noResultLabel.value).toBe('Anchor Pilot retired')
  })
})
