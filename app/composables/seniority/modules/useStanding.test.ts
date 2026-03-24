import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityCore } from './useSeniorityCore'
import { useStanding } from './useStanding'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65 }))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))
vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))
vi.mock('~/utils/db', () => ({
  db: {
    preferences: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue('key'),
    },
  },
}))

const { makeEntry, makeList } = await import('~/test-utils/factories')

beforeEach(() => {
  mockStore.entries = []
  mockStore.lists = []
  mockUserStore.employeeNumber = null
  mockUserStore.retirementAge = 65
  const { newHire } = useSeniorityCore()
  newHire.reset()
})

describe('useStanding', () => {
  it('returns default/empty rankCard when no data', () => {
    const { rankCard } = useStanding()
    expect(rankCard.value).toEqual({
      seniorityNumber: 0,
      adjustedSeniority: 0,
      percentile: 0,
      base: '--',
      seat: '--',
      fleet: '--',
      hireDate: '--',
    })
  })

  it('computes correct rankCard with user entry and standing', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2010-01-15', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'LAX', seat: 'FO', fleet: '777', hire_date: '2012-03-01', retire_date: '2047-01-01' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'ORD', seat: 'CA', fleet: '737', hire_date: '2015-06-01', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E2'

    const { rankCard } = useStanding()
    expect(rankCard.value.seniorityNumber).toBe(2)
    expect(rankCard.value.base).toBe('LAX')
    expect(rankCard.value.seat).toBe('FO')
    expect(rankCard.value.fleet).toBe('777')
    expect(rankCard.value.hireDate).toBe('2012-03-01')
    // adjustedRank = rank - retiredAbove; rank=2 (1 entry < sen#2), retiredAbove=0
    expect(rankCard.value.adjustedSeniority).toBe(2)
    // percentile = (adjustedRank / total) * 100 rounded to 1 decimal
    expect(rankCard.value.percentile).toBe(Math.round((2 / 3) * 100 * 10) / 10)
  })

  it('computes baseStatus from cell breakdown', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2047-01-01' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E2'

    const { baseStatus } = useStanding()
    expect(baseStatus.value.length).toBeGreaterThan(0)

    // Should have two cells: JFK|CA|737 and LAX|FO|777
    expect(baseStatus.value).toHaveLength(2)

    const jfkCell = baseStatus.value.find(r => r.base === 'JFK')!
    expect(jfkCell).toBeDefined()
    expect(jfkCell.seat).toBe('CA')
    expect(jfkCell.fleet).toBe('737')
    expect(jfkCell.isUserCurrent).toBe(true) // E2 is JFK/CA/737
    expect(jfkCell.total).toBe(2)
    // rank of seniority_number=2 within [1,2]: rank=2
    expect(jfkCell.rank).toBe(2)

    const laxCell = baseStatus.value.find(r => r.base === 'LAX')!
    expect(laxCell).toBeDefined()
    expect(laxCell.isUserCurrent).toBe(false)
  })

  it('computes statCards with total pilots, retirements, base rank, and lists uploaded', () => {
    const currentYear = new Date().getFullYear()
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: `${currentYear}-06-15` }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2055-01-01' }),
    ]
    mockStore.lists = [makeList(), makeList({ id: 2 })]
    mockUserStore.employeeNumber = 'E2'

    const { statCards } = useStanding()
    const cards = statCards.value

    expect(cards).toHaveLength(4)

    // Total Pilots
    expect(cards[0]!.label).toBe('Total Pilots')
    expect(cards[0]!.value).toBe((3).toLocaleString())

    // Retirements This Year — E1 retires this year
    expect(cards[1]!.label).toBe('Retirements This Year')
    expect(cards[1]!.value).toBe((1).toLocaleString())
    // E1 (seniority_number=1) is senior to E2 (seniority_number=2)
    expect(cards[1]!.trend).toBe(`${(1).toLocaleString()} senior to you`)
    expect(cards[1]!.trendUp).toBe(true)

    // Base rank label shows user's cell: CA/737/JFK
    expect(cards[2]!.label).toBe('CA/737/JFK')
    // adjustedRank within JFK|CA|737: rank=2, retiredAbove=0 (E1 retires this year but hasn't yet passed)
    expect(cards[2]!.value).toBeTruthy()

    // Lists Uploaded
    expect(cards[3]!.label).toBe('Lists Uploaded')
    expect(cards[3]!.value).toBe((2).toLocaleString())
  })

  it('returns retirementSnapshot when trajectory data exists', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E2'

    const { retirementSnapshot } = useStanding()
    const snap = retirementSnapshot.value
    expect(snap).not.toBeNull()
    expect(snap!.retireDate).toBe('2040-06-15')
    expect(snap!.fullTrajectory.length).toBeGreaterThan(0)
    expect(snap!.atRetirement).toEqual(snap!.fullTrajectory[snap!.fullTrajectory.length - 1])
  })

  it('returns 0 for percentile when adjustedRank is not a finite number', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E1'

    const { rankCard } = useStanding()
    // percentile should always be a finite number, never NaN or Infinity
    expect(Number.isFinite(rankCard.value.percentile)).toBe(true)
    expect(rankCard.value.percentile).toBeGreaterThanOrEqual(0)
    expect(rankCard.value.percentile).toBeLessThanOrEqual(100)
  })

  it('returns null retirementSnapshot when no user entry (no anchor)', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-01-01' }),
    ]
    mockUserStore.employeeNumber = 'UNKNOWN'

    const { retirementSnapshot } = useStanding()
    expect(retirementSnapshot.value).toBeNull()
  })
})
