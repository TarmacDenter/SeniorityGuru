import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _resetCoreSingletons, useSeniorityCore } from './useSeniorityCore'
import { useUpcomingRetirements } from './useUpcomingRetirements'
import { useScenario } from '~/composables/useScenario'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import { Temporal } from '~/utils/temporal'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[], currentListId: null as number | null }))
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
  mockStore.currentListId = null
  useSeniorityCore().newHire.reset()
  useScenario().scopeLabel.value = 'Company-wide'
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

  it('offers whole years from 1 to the year of the last scheduled retirement, starting at 2', () => {
    mockStore.entries = [pilot(1, 6), pilot(2, 100), pilot(3, 40)]

    const { yearsHorizon, horizonMax, horizonLabel, rows } = useUpcomingRetirements()
    expect(yearsHorizon.value).toBe(2)
    expect(horizonLabel.value).toBe(`2 years · through ${inMonths(24)}`)
    expect(horizonMax.value).toBe(9)
    yearsHorizon.value = horizonMax.value
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([1, 3, 2])
    yearsHorizon.value = 1
    expect(horizonLabel.value).toBe(`1 year · through ${inMonths(12)}`)
  })

  it('keeps the default inside the range when every retirement falls in the first year', () => {
    mockStore.entries = [pilot(1, 6)]

    const { yearsHorizon, horizonMax, rows } = useUpcomingRetirements()
    expect(horizonMax.value).toBe(1)
    expect(yearsHorizon.value).toBe(1)
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([1])
  })

  it('starts from the scenario\'s Qualification Scope and follows it until overridden', () => {
    mockStore.entries = [pilot(1, 6), pilot(2, 7, { base: 'ATL', seat: 'FO', fleet: '320' })]
    const scenario = useScenario()
    scenario.scopeLabel.value = 'ATL FO 320'

    const { rows, filterBase, filterSeat, filterFleet } = useUpcomingRetirements()
    expect([filterBase.value, filterSeat.value, filterFleet.value]).toEqual(['ATL', 'FO', '320'])
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([2])

    scenario.scopeLabel.value = 'JFK CA 737'
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([1])
  })

  it('keeps a local override, including All, when the scenario changes', () => {
    mockStore.entries = [pilot(1, 6), pilot(2, 7, { base: 'ATL', seat: 'FO', fleet: '320' })]
    const scenario = useScenario()
    scenario.scopeLabel.value = 'ATL FO 320'

    const { rows, filterBase, filterSeat, filterFleet } = useUpcomingRetirements()
    filterBase.value = null
    filterSeat.value = null
    filterFleet.value = null
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([1, 2])

    scenario.scopeLabel.value = 'JFK CA 737'
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([1, 2])
  })

  it('counts the window from the selected list\'s As-of Date, not today', () => {
    mockStore.entries = [pilot(1, -30), pilot(2, -40), pilot(3, 6)]
    mockStore.lists = [{ id: 7, title: 'Old list', effectiveDate: Temporal.PlainDate.from(inMonths(-36)) }]
    mockStore.currentListId = 7

    const { rows } = useUpcomingRetirements()
    expect(rows.value.map(row => row.seniorityNumber)).toEqual([1])
  })

  it('is empty without a list', () => {
    const { rows, hasData } = useUpcomingRetirements()
    expect(hasData.value).toBe(false)
    expect(rows.value).toEqual([])
  })
})
