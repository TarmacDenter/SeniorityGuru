// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { countRetiredAbove, generateTimePoints, buildTrajectory } from '#shared/utils/seniority-math'
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

  describe('computeRetirementProjection', () => {
    it('returns empty when no user entry', () => {
      const { computeRetirementProjection } = useDashboardStats()
      const result = computeRetirementProjection()
      expect(result).toEqual({ labels: [], data: [], filteredTotal: 0 })
    })

    it('buckets retirements into yearly intervals', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      // User retires in 2030 — so projections span from now to 2030
      // Place retirements at known dates to verify bucketing
      const now = new Date()
      const year1 = now.getFullYear() + 1
      const year2 = now.getFullYear() + 2
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: `${year1}-03-15` }),
        makeEntry({ seniority_number: 2, employee_number: '200', retire_date: `${year1}-09-15` }),
        makeEntry({ seniority_number: 3, employee_number: '300', retire_date: `${year2}-06-01` }),
        makeEntry({ seniority_number: 5, employee_number: '500', retire_date: `${now.getFullYear() + 4}-01-01` }),
      ]

      const { computeRetirementProjection } = useDashboardStats()
      const result = computeRetirementProjection()

      expect(result.labels.length).toBeGreaterThan(0)
      expect(result.data.length).toBe(result.labels.length)
      expect(result.filteredTotal).toBe(4)

      // Total retirements across all buckets should equal total entries with retire dates
      const totalRetirements = result.data.reduce((sum, n) => sum + n, 0)
      // At least the 3 non-user retirements should appear somewhere in the buckets
      expect(totalRetirements).toBeGreaterThanOrEqual(3)
    })

    it('respects filterFn to scope retirements', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      const now = new Date()
      const nextYear = now.getFullYear() + 1
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', base: 'JFK', retire_date: `${nextYear}-06-01` }),
        makeEntry({ seniority_number: 2, employee_number: '200', base: 'LAX', retire_date: `${nextYear}-06-01` }),
        makeEntry({ seniority_number: 5, employee_number: '500', base: 'JFK', retire_date: `${now.getFullYear() + 5}-01-01` }),
      ]

      const { computeRetirementProjection } = useDashboardStats()
      const allResult = computeRetirementProjection()
      const jfkResult = computeRetirementProjection((e) => e.base === 'JFK')

      expect(allResult.filteredTotal).toBe(3)
      expect(jfkResult.filteredTotal).toBe(2)

      // JFK-only should have fewer or equal retirements in buckets
      const allTotal = allResult.data.reduce((sum, n) => sum + n, 0)
      const jfkTotal = jfkResult.data.reduce((sum, n) => sum + n, 0)
      expect(jfkTotal).toBeLessThanOrEqual(allTotal)
    })
  })

  describe('computeComparativeTrajectory', () => {
    it('returns empty when no user entry', () => {
      const { computeComparativeTrajectory } = useDashboardStats()
      const result = computeComparativeTrajectory(() => true, () => true)
      expect(result).toEqual({ labels: [], currentData: [], compareData: [] })
    })

    it('computes separate trajectories for two filters', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      const now = new Date()
      mockSeniorityStore.entries = [
        // CA/JFK pilots — retire soon (user improves quickly in this category)
        makeEntry({ seniority_number: 1, employee_number: '100', seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${now.getFullYear() + 1}-01-01` }),
        makeEntry({ seniority_number: 2, employee_number: '200', seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${now.getFullYear() + 2}-01-01` }),
        // FO/LAX pilots — retire late (user stays low)
        makeEntry({ seniority_number: 3, employee_number: '300', seat: 'FO', base: 'LAX', fleet: '777', retire_date: `${now.getFullYear() + 20}-01-01` }),
        makeEntry({ seniority_number: 4, employee_number: '400', seat: 'FO', base: 'LAX', fleet: '777', retire_date: `${now.getFullYear() + 25}-01-01` }),
        // User
        makeEntry({ seniority_number: 5, employee_number: '500', seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${now.getFullYear() + 10}-01-01` }),
      ]

      const { computeComparativeTrajectory } = useDashboardStats()
      const result = computeComparativeTrajectory(
        (e) => e.seat === 'CA' && e.base === 'JFK',
        (e) => e.seat === 'FO' && e.base === 'LAX',
      )

      expect(result.labels.length).toBeGreaterThan(0)
      expect(result.currentData.length).toBe(result.labels.length)
      expect(result.compareData.length).toBe(result.labels.length)

      // In CA/JFK category, user should improve faster (higher percentile at end)
      // than in FO/LAX where nobody retires soon
      const lastCurrentPercentile = result.currentData[result.currentData.length - 1]!
      const lastComparePercentile = result.compareData[result.compareData.length - 1]!
      expect(lastCurrentPercentile).toBeGreaterThan(lastComparePercentile)
    })
  })

  describe('baseStatusData (rank values)', () => {
    it('computes correct rank and adjustedRank for user combo', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        // 2 pilots ahead, one already retired
        makeEntry({ seniority_number: 1, employee_number: '100', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2020-01-01' }),
        makeEntry({ seniority_number: 2, employee_number: '200', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-01-01' }),
        // User
        makeEntry({ seniority_number: 5, employee_number: '500', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2045-01-01' }),
      ]

      const { baseStatusData } = useDashboardStats()
      const jfkCombo = baseStatusData.value.find((d) => d.base === 'JFK')

      expect(jfkCombo).toBeDefined()
      // Raw rank: 2 pilots ahead → rank 3
      expect(jfkCombo!.rank).toBe(3)
      // 1 retired above → adjustedRank = 3 - 1 = 2
      expect(jfkCombo!.adjustedRank).toBe(2)
      expect(jfkCombo!.total).toBe(3)
      // 1 retired in combo → adjustedTotal = 3 - 1 = 2
      expect(jfkCombo!.adjustedTotal).toBe(2)
      // percentile = rank/total * 100 = 3/3 * 100 = 100
      expect(jfkCombo!.percentile).toBe(100)
      // adjustedPercentile = adjustedRank/adjustedTotal * 100 = 2/2 * 100 = 100
      expect(jfkCombo!.adjustedPercentile).toBe(100)
    })
  })

  describe('stats (trend values)', () => {
    it('shows correct retirement trend when user has retirements senior to them', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      const thisYear = new Date().getFullYear()
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: `${thisYear}-06-01` }),
        makeEntry({ seniority_number: 2, employee_number: '200', retire_date: `${thisYear}-09-01` }),
        makeEntry({ seniority_number: 10, employee_number: '999', retire_date: `${thisYear}-03-01` }), // junior to user
        makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2045-01-01' }),
      ]
      mockSeniorityStore.lists = []

      const { stats } = useDashboardStats()
      const retirementCard = stats.value[1]!

      expect(retirementCard.label).toBe('Retirements This Year')
      expect(retirementCard.value).toBe('3') // all 3 retire this year
      expect(retirementCard.trend).toBe('2 senior to you') // sen 1 and 2 are senior
      expect(retirementCard.trendUp).toBe(true)
    })

    it('shows no trend when no user entry', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, retire_date: `${new Date().getFullYear()}-06-01` }),
      ]
      mockSeniorityStore.lists = []

      const { stats } = useDashboardStats()
      const retirementCard = stats.value[1]!
      expect(retirementCard.trend).toBeUndefined()
      expect(retirementCard.trendUp).toBeUndefined()
    })
  })
})
