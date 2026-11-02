import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityCore, _resetCoreSingletons } from './useSeniorityCore'
import { useListExcerpt } from './useListExcerpt'
import { resetMockStores } from '~/test-utils/seniority-mocks'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

function listOf(count: number) {
  return Array.from({ length: count }, (_, i) =>
    makeEntry({ seniority_number: (i + 1) * 10, employee_number: `E${i + 1}`, name: `Pilot ${i + 1}`, retire_date: '2050-01-01' }))
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
})

describe('useListExcerpt', () => {
  it('returns the rows around the Anchor Pilot with only the pilot line flagged', () => {
    mockStore.entries = listOf(20)
    mockUserStore.employeeNumber = 'E10'

    const { rows } = useListExcerpt(2)
    expect(rows.value.map(row => row.nameLabel)).toEqual(['Pilot 8', 'Pilot 9', 'Pilot 10', 'Pilot 11', 'Pilot 12'])
    expect(rows.value.filter(row => row.isAnchor).map(row => row.nameLabel)).toEqual(['Pilot 10'])
    expect(rows.value.find(row => row.isAnchor)).toMatchObject({ rankLabel: '10', publicationPositionLabel: '10' })
  })

  it('stops at the top of the list', () => {
    mockStore.entries = listOf(20)
    mockUserStore.employeeNumber = 'E1'

    expect(useListExcerpt(3).rows.value.map(row => row.nameLabel)).toEqual(['Pilot 1', 'Pilot 2', 'Pilot 3', 'Pilot 4'])
  })

  it('shows a placeholder Rank for a retired pilot in the excerpt', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', name: 'Pilot 1', retire_date: '2020-01-01' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', name: 'Pilot 2', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E2'

    const retired = useListExcerpt().rows.value.find(row => row.status === 'retired')
    expect(retired).toMatchObject({ nameLabel: 'Pilot 1', rankLabel: '--' })
  })

  it('is empty when the Anchor Pilot is not on the list', () => {
    mockStore.entries = listOf(5)
    mockUserStore.employeeNumber = 'UNKNOWN'

    expect(useListExcerpt().rows.value).toEqual([])
  })

  it('flags the synthetic entry in New Hire Mode', () => {
    mockStore.entries = listOf(5)
    const { newHire } = useSeniorityCore()
    newHire.enabled.value = true
    newHire.selectedBase.value = 'JFK'
    newHire.selectedSeat.value = 'FO'
    newHire.selectedFleet.value = '737'
    newHire.birthDate.value = (mockStore.entries[0].hire_date as any).subtract({ years: 25 })

    const { rows } = useListExcerpt(1)
    expect(rows.value.map(row => row.nameLabel)).toEqual(['Pilot 5', 'You (New Hire)'])
    expect(rows.value.find(row => row.isAnchor)?.nameLabel).toBe('You (New Hire)')
  })
})
