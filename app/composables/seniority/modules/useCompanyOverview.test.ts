import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityCore, _resetCoreSingletons } from './useSeniorityCore'
import { useCompanyOverview } from './useCompanyOverview'
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
  const { newHire } = useSeniorityCore()
  newHire.reset()
})

describe('useCompanyOverview', () => {
  it('returns empty aggregateStats when no entries', () => {
    const { aggregateStats } = useCompanyOverview()
    expect(aggregateStats.value).toEqual([])
  })

  it('computes aggregateStats grouped by fleet/base', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'CA', fleet: '777', retire_date: '2050-01-01' }),
    ]

    const { aggregateStats } = useCompanyOverview()
    const stats = aggregateStats.value

    // Two groups: "737 / JFK" and "777 / LAX"
    expect(stats).toHaveLength(2)

    const jfkGroup = stats.find(g => g.category === '737 / JFK')!
    expect(jfkGroup).toBeDefined()
    expect(jfkGroup.totalPilots).toBe(2)
    // avgSeniority = (1 + 2) / 2 = 1.5
    expect(jfkGroup.avgSeniority).toBe(1.5)
    expect(jfkGroup.avgYearsToRetire).toBeGreaterThan(0)

    const laxGroup = stats.find(g => g.category === '777 / LAX')!
    expect(laxGroup).toBeDefined()
    expect(laxGroup.totalPilots).toBe(1)
    expect(laxGroup.avgSeniority).toBe(3)
  })


  it('ignores incomplete fleet/base entries and reports zero years when retire dates are missing', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E10', base: 'JFK', fleet: '737', retire_date: undefined }),
      makeEntry({ seniority_number: 20, employee_number: 'E20', base: 'JFK', fleet: '737', retire_date: undefined }),
      makeEntry({ seniority_number: 30, employee_number: 'E30', base: undefined, fleet: '737' }),
      makeEntry({ seniority_number: 40, employee_number: 'E40', base: 'JFK', fleet: undefined }),
    ]

    const { aggregateStats } = useCompanyOverview()
    expect(aggregateStats.value).toEqual([
      {
        category: '737 / JFK',
        avgSeniority: 15,
        avgYearsToRetire: 0,
        totalPilots: 2,
      },
    ])
  })

  it('formats recentLists from store lists', () => {
    mockStore.lists = [
      { id: 1, title: null, effectiveDate: '2026-01-15', createdAt: '2026-01-15T00:00:00Z' },
      { id: 2, title: null, effectiveDate: '2025-06-01', createdAt: '2025-06-01T00:00:00Z' },
    ]

    const { recentLists } = useCompanyOverview()
    const lists = recentLists.value

    expect(lists).toHaveLength(2)
    expect(lists[0]!.id).toBe(1)
    expect(lists[0]!.title).toBe('Jan 2026 Seniority List')
    expect(lists[0]!.description).toBe('Uploaded')
    expect(lists[0]!.icon).toBe('i-lucide-file-text')
    expect(lists[0]!.date).toBe('2026-01-15')

    expect(lists[1]!.id).toBe(2)
    expect(lists[1]!.title).toBe('Jun 2025 Seniority List')
  })

  it('returns quals from snapshot', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2045-01-01' }),
    ]

    const { quals } = useCompanyOverview()
    const q = quals.value
    expect(q).toHaveLength(2)
    // quals are sorted by label: "CA/737/JFK" < "FO/777/LAX"
    expect(q[0]!.label).toBe('CA/737/JFK')
    expect(q[1]!.label).toBe('FO/777/LAX')
  })

  it('returns empty quals when no snapshot', () => {
    const { quals } = useCompanyOverview()
    expect(quals.value).toEqual([])
  })
})
