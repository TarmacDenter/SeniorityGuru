import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _resetCoreSingletons, useSeniorityCore } from './useSeniorityCore'
import { useUpcomingRetirements } from './useUpcomingRetirements'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import { Temporal } from '~/utils/temporal'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

const inMonths = (months: number) => Temporal.Now.plainDateISO().add({ months }).toString()

function pilot(n: number, retireInMonths: number, overrides: Record<string, unknown> = {}) {
  return makeEntry({ seniority_number: n, employee_number: `E${n}`, name: `Pilot ${n}`, retire_date: inMonths(retireInMonths), ...overrides })
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
})

describe('useUpcomingRetirements', () => {
  it('lists retirements inside the two-year horizon, soonest first, with readable labels', () => {
    mockStore.entries = [pilot(1, 18), pilot(2, 6), pilot(3, 40), pilot(4, 600, { base: 'ATL', seat: 'FO', fleet: '320' })]

    const { rows, hasData } = useUpcomingRetirements()
    expect(hasData.value).toBe(true)
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([2, 1])
    expect(rows.value[0]).toMatchObject({ qualificationLabel: 'JFK · CA / 737', retirementDateLabel: inMonths(6), relativeLabel: null })
  })

  it('widens the list when a longer horizon is chosen', () => {
    mockStore.entries = [pilot(1, 6), pilot(2, 40), pilot(3, 600)]

    const { rows, yearsHorizon } = useUpcomingRetirements()
    yearsHorizon.value = 5
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([1, 2])
  })

  it('sorts by Seniority Number and flips direction on a second toggle', () => {
    mockStore.entries = [pilot(1, 18), pilot(2, 6), pilot(3, 12)]

    const { rows, toggleSort, sortKey, sortDir } = useUpcomingRetirements()
    toggleSort('seniorityNumber')
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([1, 2, 3])
    toggleSort('seniorityNumber')
    expect(sortDir.value).toBe('desc')
    expect(sortKey.value).toBe('seniorityNumber')
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([3, 2, 1])
  })

  it('filters by base, seat and fleet and offers the options from the list', () => {
    mockStore.entries = [pilot(1, 6), pilot(2, 7, { base: 'ATL', seat: 'FO', fleet: '320' })]

    const { rows, filterBase, baseItems } = useUpcomingRetirements()
    expect(baseItems.value.map(item => item.label)).toEqual(['All bases', 'ATL', 'JFK'])
    filterBase.value = 'ATL'
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([2])
  })

  it('shows only pilots senior to the Anchor Pilot, with a signed Rank difference, and all pilots when switched off', () => {
    mockStore.entries = [pilot(1, 6), pilot(2, 7), pilot(3, 600), pilot(4, 8)]
    mockUserStore.employeeNumber = 'E3'

    const { rows, hasAnchor, seniorOnly } = useUpcomingRetirements()
    expect(hasAnchor.value).toBe(true)
    expect(rows.value.map(row => [row.seniorityNumber, row.relativeLabel])).toEqual([[1, '+2'], [2, '+1']])
    seniorOnly.value = false
    expect(rows.value.map(row => [row.seniorityNumber, row.relativeLabel])).toEqual([[1, '+2'], [2, '+1'], [4, '-1']])
  })

  it('is empty without a list', () => {
    const { rows, hasData } = useUpcomingRetirements()
    expect(hasData.value).toBe(false)
    expect(rows.value).toEqual([])
  })
})
