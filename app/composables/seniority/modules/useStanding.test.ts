import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityCore, _resetCoreSingletons } from './useSeniorityCore'
import { useStanding } from './useStanding'
import { parsePlainDate, todayPlainDate } from '~/utils/temporal'
import type { QualificationScope } from '~/utils/seniority'
import { resetMockStores } from '~/test-utils/seniority-mocks'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry, makeList } = await import('~/test-utils/factories')

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  const { newHire } = useSeniorityCore()
  newHire.reset()
})

describe('useStanding', () => {
  it('returns default/empty rankCard when no data', () => {
    const { rankCard } = useStanding()
    expect(rankCard.value).toEqual({
      seniorityNumber: 0,
      rank: 0,
      publicationPosition: 0,
      rosterSize: 0,
      publicationPilotCount: 0,
      activePilotCount: 0,
      isSimulated: false,
      seniorityPercentile: 0,
      base: '--',
      seat: '--',
      fleet: '--',
      hireDate: '--',
      noResultLabel: null,
      hypotheticalLabel: null,
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
    expect(rankCard.value.rank).toBe(2)
    expect(rankCard.value.seniorityPercentile).toBe(Math.round((2 / 3) * 100 * 10) / 10)
  })

  it('distinguishes Seniority Number, Rank, and Publication Position for a gapped list', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E1', retire_date: '2020-01-01' }),
      makeEntry({ seniority_number: 40, employee_number: 'E2', retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 90, employee_number: 'E3', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 120, employee_number: 'E4', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E3'

    const { rankCard } = useStanding()

    expect(rankCard.value).toMatchObject({
      seniorityNumber: 90,
      publicationPosition: 3,
      rosterSize: 4,
      rank: 2,
      activePilotCount: 3,
      seniorityPercentile: 75,
      isSimulated: false,
    })
  })

  it.each([null, 'E2'])('uses the simulated Anchor Pilot for every personal summary with real pilot %s', (employeeNumber) => {
    mockUserStore.employeeNumber = employeeNumber
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E1', retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 40, employee_number: 'E2', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 90, employee_number: 'E3', retire_date: '2050-01-01' }),
    ]
    const { newHire } = useSeniorityCore()
    newHire.enabled.value = true
    newHire.selectedBase.value = 'LAX'
    newHire.selectedSeat.value = 'FO'
    newHire.selectedFleet.value = '777'
    newHire.birthDate.value = parsePlainDate('2000-06-15')

    const { rankCard, statCards, retirementSnapshot } = useStanding()

    expect(rankCard.value).toEqual({
      seniorityNumber: 91,
      publicationPosition: 4,
      rosterSize: 4,
      publicationPilotCount: 3,
      rank: 4,
      activePilotCount: 4,
      seniorityPercentile: 25,
      isSimulated: true,
      base: 'LAX',
      seat: 'FO',
      fleet: '777',
      hireDate: todayPlainDate().toString(),
      noResultLabel: null,
      hypotheticalLabel: null,
    })
    expect(statCards.value[2]).toMatchObject({ label: 'Your Base Rank', value: '1', trend: 'FO/777/LAX · of 1 on roster · 1 active' })
    expect(retirementSnapshot.value?.retireDate).toBe('2065-06-15')
    expect(retirementSnapshot.value?.fullTrajectory[0]?.rank).toBe(4)
  })

  it('switches all personal summaries to the simulated pilot and restores the real pilot on disable', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E1', retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 40, employee_number: 'E2', hire_date: '2012-03-01', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 90, employee_number: 'E3', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E2'
    const { newHire } = useSeniorityCore()
    const { rankCard, statCards, retirementSnapshot } = useStanding()
    const realCard = { ...rankCard.value }
    const realStats = statCards.value
    const realSnapshot = retirementSnapshot.value

    newHire.selectedBase.value = 'LAX'
    newHire.selectedSeat.value = 'FO'
    newHire.selectedFleet.value = '777'
    newHire.birthDate.value = parsePlainDate('2000-06-15')
    newHire.enabled.value = true

    expect(rankCard.value).toMatchObject({
      seniorityNumber: 91, publicationPosition: 4, rosterSize: 4, rank: 4,
      activePilotCount: 4, isSimulated: true, base: 'LAX', seat: 'FO', fleet: '777',
      hireDate: todayPlainDate().toString(),
      noResultLabel: null,
      hypotheticalLabel: null,
    })
    expect(statCards.value[2]).toMatchObject({ label: 'Your Base Rank', value: '1', trend: 'FO/777/LAX · of 1 on roster · 1 active' })
    expect(retirementSnapshot.value?.retireDate).toBe('2065-06-15')
    expect(retirementSnapshot.value?.fullTrajectory[0]?.rank).toBe(4)

    newHire.enabled.value = false

    expect(rankCard.value).toEqual(realCard)
    expect(rankCard.value).toMatchObject({ rosterSize: 3, activePilotCount: 3, isSimulated: false })
    expect(statCards.value).toEqual(realStats)
    expect(retirementSnapshot.value).toEqual(realSnapshot)
  })

  describe('Roster Size agreement', () => {
    function enableNewHire() {
      const { newHire } = useSeniorityCore()
      newHire.selectedBase.value = 'LAX'
      newHire.selectedSeat.value = 'FO'
      newHire.selectedFleet.value = '777'
      newHire.birthDate.value = parsePlainDate('2000-06-15')
      newHire.enabled.value = true
    }

    it('real Anchor Pilot: Roster Size agrees with Roster Size and is not modeled', () => {
      mockStore.entries = [
        makeEntry({ seniority_number: 10, employee_number: 'E1', retire_date: '2020-01-01' }),
        makeEntry({ seniority_number: 40, employee_number: 'E2', retire_date: '2045-01-01' }),
        makeEntry({ seniority_number: 90, employee_number: 'E3', retire_date: '2050-01-01' }),
      ]
      mockUserStore.employeeNumber = 'E2'

      const { rankCard, statCards } = useStanding()

      expect(rankCard.value).toMatchObject({ rosterSize: 3, publicationPilotCount: 3, isSimulated: false })
      expect(statCards.value[0]).toEqual({ label: 'Roster Size', value: '3', icon: 'i-lucide-users' })
    })

    it.each([
      ['retirements before the hire date', '2020-01-01', 3, 5],
      ['retirements after the hire date', '2060-01-01', 4, 5],
    ])('New Hire Mode with %s: every count includes the simulated pilot', (_name, retire, active, roster) => {
      mockStore.entries = [
        makeEntry({ seniority_number: 10, employee_number: 'E1', retire_date: retire }),
        makeEntry({ seniority_number: 40, employee_number: 'E2', retire_date: '2045-01-01' }),
        makeEntry({ seniority_number: 90, employee_number: 'E3', retire_date: '2050-01-01' }),
        makeEntry({ seniority_number: 95, employee_number: 'E4', retire_date: '2055-01-01' }),
      ]
      mockUserStore.employeeNumber = 'E2'
      enableNewHire()

      const { rankCard, statCards } = useStanding()

      expect(rankCard.value).toMatchObject({
        isSimulated: true,
        rosterSize: roster,
        publicationPilotCount: 4,
        publicationPosition: roster,
        activePilotCount: active + 1,
      })
      expect(statCards.value[0]).toMatchObject({
        label: 'Roster Size (modeled)',
        value: roster.toLocaleString(),
        trend: '4 in publication',
      })
      expect(statCards.value[0]!.value).toBe(rankCard.value.rosterSize.toLocaleString())
    })
  })

  it('follows the selected Qualification Scope: Roster Size is the pilots in that scope', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 40, employee_number: 'E2', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 90, employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 95, employee_number: 'E4', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E3'
    const scope = ref<QualificationScope>({})
    const { rankCard } = useStanding(scope)

    expect(rankCard.value).toMatchObject({ rank: 3, rosterSize: 4 })

    scope.value = { base: 'LAX' }

    expect(rankCard.value).toMatchObject({ rank: 2, publicationPosition: 2, rosterSize: 2 })
  })

  describe('Hypothetical Placement outside the selected scope', () => {
    function outsideScopeRoster() {
      mockStore.entries = [
        makeEntry({ seniority_number: 10, employee_number: 'E1', base: 'JFK', retire_date: '2050-01-01' }),
        makeEntry({ seniority_number: 40, employee_number: 'E2', base: 'LAX', retire_date: '2050-01-01' }),
        makeEntry({ seniority_number: 50, employee_number: 'E3', base: 'JFK', retire_date: '2050-01-01' }),
      ]
      mockUserStore.employeeNumber = 'E2'
    }

    it('places the Anchor Pilot in the scope, names it, and keeps Rank within Roster Size', () => {
      outsideScopeRoster()
      const { rankCard } = useStanding(ref<QualificationScope>({ base: 'JFK' }))

      expect(rankCard.value).toMatchObject({
        noResultLabel: null,
        hypotheticalLabel: 'Hypothetical Placement in JFK',
        publicationPosition: 2,
        rank: 2,
        rosterSize: 3,
      })
    })

    it('labels the Roster Size stat card hypothetical and keeps it equal to the Rank card', () => {
      outsideScopeRoster()
      const { rankCard, statCards } = useStanding(ref<QualificationScope>({ base: 'JFK' }))

      expect(statCards.value[0]).toMatchObject({
        label: 'Roster Size (hypothetical)',
        value: rankCard.value.rosterSize.toLocaleString(),
        trend: 'includes you',
      })
    })

    it('shows both modeled and hypothetical labels in New Hire Mode', () => {
      outsideScopeRoster()
      const { newHire } = useSeniorityCore()
      newHire.selectedBase.value = 'LAX'
      newHire.selectedSeat.value = 'FO'
      newHire.selectedFleet.value = '777'
      newHire.birthDate.value = parsePlainDate('2000-06-15')
      newHire.enabled.value = true
      const { rankCard, statCards } = useStanding(ref<QualificationScope>({ base: 'JFK' }))

      expect(rankCard.value).toMatchObject({
        isSimulated: true,
        hypotheticalLabel: 'Hypothetical Placement in JFK',
        rosterSize: 3,
        publicationPilotCount: 2,
      })
      expect(statCards.value[0]).toMatchObject({
        label: 'Roster Size (modeled, hypothetical)',
        trend: '2 in publication · includes you',
      })
    })

    it('marks only the qualifications the Anchor Pilot is not in, each with Rank within Roster Size', () => {
      outsideScopeRoster()
      const { baseStatus } = useStanding()

      const own = baseStatus.value.find(row => row.base === 'LAX')!
      const other = baseStatus.value.find(row => row.base === 'JFK')!
      expect(own).toMatchObject({ hypotheticalLabel: null, isAnchorCurrentQualification: true })
      expect(other).toMatchObject({ hypotheticalLabel: 'Hypothetical Placement in JFK CA 737', rank: 2, rosterSize: 3 })
      for (const row of baseStatus.value) expect(row.rank).toBeLessThanOrEqual(row.rosterSize)
    })

    it('carries the label onto the retirement snapshot', () => {
      outsideScopeRoster()
      const { retirementSnapshot } = useStanding(ref<QualificationScope>({ base: 'JFK' }))

      expect(retirementSnapshot.value?.hypotheticalLabel).toBe('Hypothetical Placement in JFK')
      expect(retirementSnapshot.value?.rosterSize).toBe(3)
    })

    it('has no label for a member of the scope', () => {
      outsideScopeRoster()
      const { rankCard } = useStanding(ref<QualificationScope>({ base: 'LAX' }))

      expect(rankCard.value.hypotheticalLabel).toBeNull()
    })

    it('still reports a retired Anchor Pilot outside the scope as the only no-result', () => {
      outsideScopeRoster()
      mockStore.entries[1] = makeEntry({ seniority_number: 40, employee_number: 'E2', base: 'LAX', retire_date: '2020-01-01' })
      const { rankCard } = useStanding(ref<QualificationScope>({ base: 'JFK' }))

      expect(rankCard.value.noResultLabel).toBe('Anchor Pilot retired')
      expect(rankCard.value.hypotheticalLabel).toBeNull()
    })
  })

  it.each([null, 'E1'])('preserves the existing anchor with incomplete new hire settings and real pilot %s', (employeeNumber) => {
    mockStore.entries = [makeEntry({ seniority_number: 40, employee_number: 'E1', retire_date: '2045-01-01' })]
    mockUserStore.employeeNumber = employeeNumber
    const { newHire } = useSeniorityCore()
    const { rankCard, statCards, retirementSnapshot } = useStanding()
    const originalCard = rankCard.value
    const originalStats = statCards.value
    const originalSnapshot = retirementSnapshot.value

    newHire.enabled.value = true
    newHire.selectedBase.value = 'LAX'

    expect(rankCard.value).toEqual(originalCard)
    expect(rankCard.value.isSimulated).toBe(false)
    expect(statCards.value).toEqual(originalStats)
    expect(retirementSnapshot.value).toEqual(originalSnapshot)
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
    expect(jfkCell.isAnchorCurrentQualification).toBe(true)
    expect(jfkCell.rosterSize).toBe(2)
    expect(jfkCell.rank).toBe(2)

    const laxCell = baseStatus.value.find(r => r.base === 'LAX')!
    expect(laxCell).toBeDefined()
    expect(laxCell.isAnchorCurrentQualification).toBe(false)
  })

  it('computes statCards with total pilots, retirements, base rank, and lists uploaded', () => {
    // Use a date 6 months from today so it reliably falls within the rolling 12-month window
    const sixMonthsFromNow = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: sixMonthsFromNow }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2055-01-01' }),
    ]
    mockStore.lists = [makeList(), makeList({ id: 2 })]
    mockUserStore.employeeNumber = 'E2'

    const { statCards } = useStanding()
    const cards = statCards.value

    expect(cards).toHaveLength(4)

    // Roster Size
    expect(cards[0]!.label).toBe('Roster Size')
    expect(cards[0]!.value).toBe((3).toLocaleString())

    // Retirements This Year — E1 retires within next 12 months
    expect(cards[1]!.label).toBe('Retirements (Next 12 mo.)')
    expect(cards[1]!.value).toBe((1).toLocaleString())
    // E1 (seniority_number=1) is senior to E2 (seniority_number=2)
    expect(cards[1]!.trend).toBe(`${(1).toLocaleString()} senior to you`)
    expect(cards[1]!.trendUp).toBe(true)

    // Base rank label shows user's cell: CA/737/JFK
    expect(cards[2]).toMatchObject({
      label: 'Your Base Rank',
      value: '2',
      trend: 'CA/737/JFK · of 2 on roster · 2 active',
    })

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
    expect(Number.isFinite(rankCard.value.seniorityPercentile)).toBe(true)
    expect(rankCard.value.seniorityPercentile).toBeGreaterThanOrEqual(0)
    expect(rankCard.value.seniorityPercentile).toBeLessThanOrEqual(100)
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
