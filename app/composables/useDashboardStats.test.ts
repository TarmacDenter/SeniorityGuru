// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SeniorityEntryResponse, SeniorityListResponse } from '../../shared/schemas/seniority-list'
import type { ProfileResponse } from '../../shared/schemas/settings'

type SeniorityEntry = SeniorityEntryResponse
type SeniorityList = SeniorityListResponse
type Profile = ProfileResponse

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
    title: null,
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

// Mock useNewHireMode to be inactive by default (no synthetic entry)
const mockNewHireMode = vi.hoisted(() => ({
  enabled: { value: false },
  selectedBase: { value: null as string | null },
  selectedSeat: { value: null as string | null },
  selectedFleet: { value: null as string | null },
  availableBases: { value: [] as string[] },
  availableSeats: { value: [] as string[] },
  availableFleets: { value: [] as string[] },
  realUserFound: { value: false },
  isActive: { value: false },
  syntheticEntry: { value: null as SeniorityEntry | null },
}))

vi.mock('./useNewHireMode', () => ({
  useNewHireMode: () => mockNewHireMode,
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
    mockNewHireMode.enabled.value = false
    mockNewHireMode.isActive.value = false
    mockNewHireMode.syntheticEntry.value = null
    mockNewHireMode.realUserFound.value = false
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

  describe('new hire mode integration', () => {
    it('userFound is true when new hire mode provides synthetic entry', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100' }),
      ]
      mockNewHireMode.isActive.value = true
      mockNewHireMode.syntheticEntry.value = makeEntry({
        id: 'synthetic-new-hire',
        seniority_number: 2,
        employee_number: '999',
        name: 'You (New Hire)',
        base: 'JFK',
        seat: 'CA',
        fleet: '737',
        retire_date: null,
      })

      const { userFound, isNewHireMode } = useDashboardStats()
      expect(userFound.value).toBe(true)
      expect(isNewHireMode.value).toBe(true)
    })

    it('uses synthetic entry for rank card when new hire mode active', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100' }),
        makeEntry({ seniority_number: 2, employee_number: '200' }),
      ]
      mockNewHireMode.isActive.value = true
      mockNewHireMode.syntheticEntry.value = makeEntry({
        id: 'synthetic-new-hire',
        seniority_number: 3,
        employee_number: '999',
        name: 'You (New Hire)',
        base: 'LAX',
        seat: 'FO',
        fleet: '777',
        retire_date: null,
      })

      const { rankCard } = useDashboardStats()
      expect(rankCard.value.seniorityNumber).toBe(3)
      expect(rankCard.value.base).toBe('LAX')
      expect(rankCard.value.seat).toBe('FO')
      expect(rankCard.value.fleet).toBe('777')
    })

    it('prefers real entry over synthetic when user IS found', () => {
      mockUserStore.profile = makeProfile({ employee_number: '100' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', base: 'JFK' }),
      ]
      // Even if new hire mode is technically enabled, isActive should be false
      // because realUserFound is true — but let's test that the real entry wins
      mockNewHireMode.isActive.value = false
      mockNewHireMode.syntheticEntry.value = null

      const { rankCard, userFound } = useDashboardStats()
      expect(userFound.value).toBe(true)
      expect(rankCard.value.base).toBe('JFK')
    })

    it('isNewHireMode is false when new hire mode not active', () => {
      const { isNewHireMode } = useDashboardStats()
      expect(isNewHireMode.value).toBe(false)
    })
  })
})
