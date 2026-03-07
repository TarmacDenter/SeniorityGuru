// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { countRetiredAbove, generateTimePoints, buildTrajectory } from './useDashboardStats'
import type { Tables } from '../../shared/types/database'

type SeniorityEntry = Tables<'seniority_entries'>
type SeniorityList = Tables<'seniority_lists'>
type Profile = Tables<'profiles'>

// --- Helper to create mock entries ---
function makeEntry(overrides: Partial<SeniorityEntry> = {}): SeniorityEntry {
  return {
    id: 'entry-1',
    list_id: 'list-1',
    seniority_number: 1,
    employee_number: '100',
    name: 'Test Pilot',
    hire_date: '2010-01-15',
    base: 'JFK',
    seat: 'CA',
    fleet: '737',
    retire_date: '2035-06-15',
    ...overrides,
  }
}

function makeList(overrides: Partial<SeniorityList> = {}): SeniorityList {
  return {
    id: 'list-1',
    airline: 'DAL',
    effective_date: '2026-01-15',
    created_at: '2026-01-15T00:00:00Z',
    status: 'active',
    uploaded_by: 'user-1',
    ...overrides,
  }
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    role: 'user',
    icao_code: 'DAL',
    employee_number: '500',
    created_at: '2026-01-01T00:00:00Z',
    mandatory_retirement_age: 65,
    ...overrides,
  }
}

// --- Tests for pure helper functions ---

describe('countRetiredAbove', () => {
  it('returns 0 when no entries have retired', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2041-01-01' }),
    ]
    const result = countRetiredAbove(entries, 3, new Date('2026-06-01'))
    expect(result).toBe(0)
  })

  it('counts only entries with seniority_number < userSenNum AND retire_date <= asOfDate', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2025-01-01' }), // retired, senior -> counts
      makeEntry({ seniority_number: 2, retire_date: '2025-06-01' }), // retired, senior -> counts
      makeEntry({ seniority_number: 3, retire_date: '2025-01-01' }), // retired, but NOT senior (>= 3)
      makeEntry({ seniority_number: 4, retire_date: '2024-01-01' }), // retired, but NOT senior (>= 3)
      makeEntry({ seniority_number: 1, retire_date: '2030-01-01' }), // senior, but NOT retired yet
    ]
    const result = countRetiredAbove(entries, 3, new Date('2026-01-01'))
    expect(result).toBe(2)
  })

  it('respects filterFn', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2025-01-01', base: 'JFK' }),
      makeEntry({ seniority_number: 2, retire_date: '2025-01-01', base: 'LAX' }),
    ]
    const result = countRetiredAbove(entries, 5, new Date('2026-01-01'), (e) => e.base === 'JFK')
    expect(result).toBe(1)
  })

  it('handles null retire_date (should NOT count as retired)', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: null }),
      makeEntry({ seniority_number: 2, retire_date: null }),
    ]
    const result = countRetiredAbove(entries, 5, new Date('2026-01-01'))
    expect(result).toBe(0)
  })
})

describe('generateTimePoints', () => {
  it('generates yearly points', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2031-01-01') // 5 years
    const points = generateTimePoints(start, end)

    // 6 yearly points (2026 through 2031 inclusive)
    expect(points.length).toBe(6)

    // First point is start
    expect(points[0]!.toISOString().split('T')[0]).toBe('2026-01-01')

    // Second point is one year later
    expect(points[1]!.toISOString().split('T')[0]).toBe('2027-01-01')

    // All within range
    for (const p of points) {
      expect(p.getTime()).toBeLessThanOrEqual(end.getTime())
    }
  })

  it('generates correct number of points for long range', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2040-01-01') // 14 years
    const points = generateTimePoints(start, end)

    // 15 yearly points (2026 through 2040 inclusive)
    expect(points.length).toBe(15)

    // Last point should reach 2040
    expect(points[points.length - 1]!.toISOString().split('T')[0]).toBe('2040-01-01')
  })

  it('stops at or before endDate', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2038-06-15')
    const points = generateTimePoints(start, end)

    for (const p of points) {
      expect(p.getTime()).toBeLessThanOrEqual(end.getTime())
    }
  })

  it('handles short range', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2027-06-01') // 1.5 years
    const points = generateTimePoints(start, end)

    // 2 yearly points: 2026-01-01 and 2027-01-01
    expect(points.length).toBe(2)

    // All should be within range
    for (const p of points) {
      expect(p.getTime()).toBeLessThanOrEqual(end.getTime())
    }
  })
})

describe('buildTrajectory', () => {
  it('returns decreasing rank over time as retirements accumulate', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: '2026-06-01' }),
      makeEntry({ seniority_number: 2, retire_date: '2027-06-01' }),
      makeEntry({ seniority_number: 3, retire_date: '2028-06-01' }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
    ]

    const timePoints = [
      new Date('2026-01-01'),
      new Date('2026-12-01'),
      new Date('2027-12-01'),
      new Date('2028-12-01'),
    ]

    const trajectory = buildTrajectory(entries, 5, timePoints)

    // 3 pilots ahead (sen 1,2,3), so initial rank = 4 of 4 total
    // Inverted percentile with static denominator: (total - rank + 1) / total * 100
    // 100% = most senior, 0% = most junior
    expect(trajectory).toEqual([
      { date: '2026-01-01', rank: 4, percentile: 25 },    // (4-4+1)/4 = 25%
      { date: '2026-12-01', rank: 3, percentile: 50 },    // (4-3+1)/4 = 50%
      { date: '2027-12-01', rank: 2, percentile: 75 },    // (4-2+1)/4 = 75%
      { date: '2028-12-01', rank: 1, percentile: 100 },   // (4-1+1)/4 = 100%
    ])
  })

  it('returns empty array when no time points', () => {
    const entries = [makeEntry({ seniority_number: 1 })]
    const trajectory = buildTrajectory(entries, 5, [])
    expect(trajectory).toEqual([])
  })

  it('handles entries with no retire_date', () => {
    const entries = [
      makeEntry({ seniority_number: 1, retire_date: null }),
      makeEntry({ seniority_number: 2, retire_date: null }),
      makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
    ]

    const timePoints = [new Date('2030-01-01'), new Date('2035-01-01')]
    const trajectory = buildTrajectory(entries, 5, timePoints)

    // 2 pilots ahead (sen 1,2), no retirements (null retire_date), so rank stays at 3 of 3
    // (3 - 3 + 1) / 3 = 33.3%
    expect(trajectory).toEqual([
      { date: '2030-01-01', rank: 3, percentile: 33.3 },
      { date: '2035-01-01', rank: 3, percentile: 33.3 },
    ])
  })
})

// --- Tests for the composable (mocked stores) ---

const mockSeniorityStore = vi.hoisted(() => ({
  entries: [] as SeniorityEntry[],
  lists: [] as SeniorityList[],
}))

const mockUserStore = vi.hoisted(() => ({
  profile: null as Profile | null,
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockSeniorityStore,
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

// Mock Vue's computed to work outside component context
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    // computed works fine in node environment from vue directly
  }
})

// We need to use the actual vue computed in node env
// Import useDashboardStats after mocks are set up
const { useDashboardStats } = await import('./useDashboardStats')

describe('useDashboardStats composable', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockSeniorityStore.lists = []
    mockUserStore.profile = null
  })

  describe('hasData', () => {
    it('is false when entries empty', () => {
      const { hasData } = useDashboardStats()
      expect(hasData.value).toBe(false)
    })

    it('is true when entries populated', () => {
      mockSeniorityStore.entries = [makeEntry()]
      const { hasData } = useDashboardStats()
      expect(hasData.value).toBe(true)
    })
  })

  describe('hasEmployeeNumber', () => {
    it('is false when profile has no employee_number', () => {
      mockUserStore.profile = makeProfile({ employee_number: null })
      const { hasEmployeeNumber } = useDashboardStats()
      expect(hasEmployeeNumber.value).toBe(false)
    })

    it('is true when profile has employee_number', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      const { hasEmployeeNumber } = useDashboardStats()
      expect(hasEmployeeNumber.value).toBe(true)
    })
  })

  describe('userFound', () => {
    it('is false when no matching entry', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { userFound } = useDashboardStats()
      expect(userFound.value).toBe(false)
    })

    it('is true when matching entry exists', () => {
      mockUserStore.profile = makeProfile({ employee_number: '100' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { userFound } = useDashboardStats()
      expect(userFound.value).toBe(true)
    })
  })

  describe('rankCard', () => {
    it('returns defaults when no user entry', () => {
      const { rankCard } = useDashboardStats()
      expect(rankCard.value.seniorityNumber).toBe(0)
      expect(rankCard.value.adjustedSeniority).toBe(0)
      expect(rankCard.value.base).toBe('--')
    })

    it('computes correct adjusted seniority', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: '2020-01-01' }),
        makeEntry({ seniority_number: 2, employee_number: '200', retire_date: '2022-01-01' }),
        makeEntry({ seniority_number: 3, employee_number: '300', retire_date: '2040-01-01' }),
        makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2045-01-01' }),
      ]

      const { rankCard } = useDashboardStats()
      // 2 entries retired above (sen nums 1 and 2), so adjusted = 5 - 2 = 3
      expect(rankCard.value.seniorityNumber).toBe(5)
      expect(rankCard.value.adjustedSeniority).toBe(3)
      expect(rankCard.value.base).toBe('JFK')
      expect(rankCard.value.seat).toBe('CA')
      expect(rankCard.value.fleet).toBe('737')
    })
  })

  describe('stats', () => {
    it('returns 4 items with correct values', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', base: 'JFK', retire_date: `${new Date().getFullYear()}-06-01` }),
        makeEntry({ seniority_number: 2, employee_number: '200', base: 'JFK', retire_date: '2040-01-01' }),
        makeEntry({ seniority_number: 5, employee_number: '500', base: 'JFK', retire_date: '2045-01-01' }),
      ]
      mockSeniorityStore.lists = [makeList(), makeList({ id: 'list-2' })]

      const { stats } = useDashboardStats()
      const s = stats.value

      expect(s).toHaveLength(4)
      expect(s![0]!.label).toBe('Total Pilots')
      expect(s![0]!.value).toBe('3')
      expect(s![1]!.label).toBe('Retirements This Year')
      expect(s![3]!.label).toBe('Lists Uploaded')
      expect(s![3]!.value).toBe('2')
      expect(s![2]!.label).toBe('CA/737/JFK')
    })
  })

  describe('baseStatusData', () => {
    it('groups by base/seat/fleet correctly', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ seniority_number: 2, employee_number: '200', base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ seniority_number: 3, employee_number: '300', base: 'LAX', seat: 'FO', fleet: '777' }),
        makeEntry({ seniority_number: 5, employee_number: '500', base: 'JFK', seat: 'CA', fleet: '737' }),
      ]

      const { baseStatusData } = useDashboardStats()
      const data = baseStatusData.value

      expect(data.length).toBe(2)

      const jfkCombo = data.find((d) => d.base === 'JFK')
      expect(jfkCombo).toBeDefined()
      expect(jfkCombo!.total).toBe(3)
      expect(jfkCombo!.isUserCurrent).toBe(true)

      const laxCombo = data.find((d) => d.base === 'LAX')
      expect(laxCombo).toBeDefined()
      expect(laxCombo!.total).toBe(1)
      expect(laxCombo!.isUserCurrent).toBe(false)
    })
  })

  describe('aggregateStats', () => {
    it('computes correct averages', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 10, fleet: '737', base: 'JFK', retire_date: '2036-01-01' }),
        makeEntry({ seniority_number: 20, fleet: '737', base: 'JFK', retire_date: '2040-01-01' }),
        makeEntry({ seniority_number: 5, fleet: '777', base: 'LAX', retire_date: '2035-01-01' }),
      ]

      const { aggregateStats } = useDashboardStats()
      const agg = aggregateStats.value

      expect(agg.length).toBe(2)

      const group737 = agg.find((a) => a.category === '737 / JFK')
      expect(group737).toBeDefined()
      expect(group737!.totalPilots).toBe(2)
      expect(group737!.avgSeniority).toBe(15)

      const group777 = agg.find((a) => a.category === '777 / LAX')
      expect(group777).toBeDefined()
      expect(group777!.totalPilots).toBe(1)
      expect(group777!.avgSeniority).toBe(5)
    })

    it('skips entries with null fleet or base', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, fleet: null, base: 'JFK' }),
        makeEntry({ seniority_number: 2, fleet: '737', base: null }),
        makeEntry({ seniority_number: 3, fleet: '737', base: 'JFK' }),
      ]

      const { aggregateStats } = useDashboardStats()
      expect(aggregateStats.value.length).toBe(1)
      expect(aggregateStats.value[0]!.totalPilots).toBe(1)
    })
  })

  describe('recentLists', () => {
    it('maps lists correctly', () => {
      mockSeniorityStore.lists = [
        makeList({ effective_date: '2026-01-15' }),
        makeList({ id: 'list-2', effective_date: '2025-06-01' }),
      ]

      const { recentLists } = useDashboardStats()
      const lists = recentLists.value

      expect(lists).toHaveLength(2)
      expect(lists[0]!.title).toBe('Jan 2026 Seniority List')
      expect(lists[0]!.description).toBe('Uploaded')
      expect(lists[0]!.icon).toBe('i-lucide-file-text')
      expect(lists[0]!.date).toBe('2026-01-15')
      expect(lists[1]!.title).toBe('Jun 2025 Seniority List')
    })
  })

  describe('quals', () => {
    it('builds unique qual combos from actual entries', () => {
      mockSeniorityStore.entries = [
        makeEntry({ base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ base: 'LAX', seat: 'FO', fleet: '777' }),
        makeEntry({ base: 'JFK', seat: 'CA', fleet: '737' }), // duplicate
        makeEntry({ base: null, seat: null, fleet: null }), // nulls excluded
      ]

      const { quals } = useDashboardStats()
      expect(quals.value).toEqual([
        { seat: 'CA', fleet: '737', base: 'JFK', label: 'CA/737/JFK' },
        { seat: 'FO', fleet: '777', base: 'LAX', label: 'FO/777/LAX' },
      ])
    })

    it('does not generate combos that do not exist in the data', () => {
      mockSeniorityStore.entries = [
        makeEntry({ base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ base: 'LAX', seat: 'FO', fleet: '777' }),
      ]

      const { quals } = useDashboardStats()
      const labels = quals.value.map((q) => q.label)
      // Should NOT contain cross-product combos like CA/777/LAX
      expect(labels).not.toContain('CA/777/LAX')
      expect(labels).not.toContain('FO/737/JFK')
      expect(labels).toHaveLength(2)
    })
  })

  describe('trajectoryData', () => {
    it('returns empty data when no user entry', () => {
      const { trajectoryData } = useDashboardStats()
      expect(trajectoryData.value.labels).toEqual([])
      expect(trajectoryData.value.data).toEqual([])
    })

    it('returns trajectory data when user entry exists', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: '2026-06-01' }),
        makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
      ]

      const { trajectoryData } = useDashboardStats()
      expect(trajectoryData.value.labels.length).toBeGreaterThan(0)
      expect(trajectoryData.value.data.length).toBeGreaterThan(0)
      // Percentile should increase over time as retirements improve standing (up = more senior)
      expect(trajectoryData.value.data[trajectoryData.value.data.length - 1]!).toBeGreaterThanOrEqual(
        trajectoryData.value.data[0]!,
      )
    })
  })
})
