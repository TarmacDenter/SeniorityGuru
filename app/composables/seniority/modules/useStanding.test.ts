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

const { makeEntry } = await import('~/test-utils/factories')

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
      rank: null,
      publicationPosition: null,
      rosterSize: null,
      publicationPilotCount: null,
      activePilotCount: null,
      isSimulated: false,
      seniorityPercentile: null,
      base: '--',
      seat: '--',
      fleet: '--',
      hireDate: '--',
      noResultLabel: null,
      hypotheticalLabel: null,
      rosterSummaryLabel: null,
      percentileScaleLabel: null,
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

    const { rankCard } = useStanding()

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
      rosterSummaryLabel: 'Roster Size 4 · Active pilots 4',
      percentileScaleLabel: 'Percentile measured against Roster Size 4 · Active pilots 4',
    })
  })

  it('switches all personal summaries to the simulated pilot and restores the real pilot on disable', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E1', retire_date: '2040-01-01' }),
      makeEntry({ seniority_number: 40, employee_number: 'E2', hire_date: '2012-03-01', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 90, employee_number: 'E3', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E2'
    const { newHire } = useSeniorityCore()
    const { rankCard } = useStanding()
    const realCard = { ...rankCard.value }

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

    newHire.enabled.value = false

    expect(rankCard.value).toEqual(realCard)
    expect(rankCard.value).toMatchObject({ rosterSize: 3, activePilotCount: 3, isSimulated: false })
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

      const { rankCard } = useStanding()

      expect(rankCard.value).toMatchObject({
        rosterSize: 3,
        publicationPilotCount: 3,
        isSimulated: false,
        rosterSummaryLabel: 'Roster Size 3 · Active pilots 2',
        percentileScaleLabel: 'Percentile measured against Roster Size 3 · Active pilots 2',
      })
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

      const { rankCard } = useStanding()

      expect(rankCard.value).toMatchObject({
        isSimulated: true,
        rosterSize: roster,
        publicationPilotCount: 4,
        publicationPosition: roster,
        activePilotCount: active + 1,
      })
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

  it('returns a different rank card for each Qualification Scope', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E1', base: 'JFK', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 40, employee_number: 'E2', base: 'LAX', retire_date: '2045-01-01' }),
      makeEntry({ seniority_number: 90, employee_number: 'E3', base: 'LAX', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E3'

    const companyWide = useStanding().rankCard.value
    const lax = useStanding(ref<QualificationScope>({ base: 'LAX' })).rankCard.value

    expect(companyWide).toMatchObject({ rank: 3, rosterSize: 3, rosterSummaryLabel: 'Roster Size 3 · Active pilots 3' })
    expect(lax).toMatchObject({ rank: 2, rosterSize: 2, rosterSummaryLabel: 'Roster Size 2 · Active pilots 2' })
    expect(lax).not.toEqual(companyWide)
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

    it('shows both modeled and hypothetical labels in New Hire Mode', () => {
      outsideScopeRoster()
      const { newHire } = useSeniorityCore()
      newHire.selectedBase.value = 'LAX'
      newHire.selectedSeat.value = 'FO'
      newHire.selectedFleet.value = '777'
      newHire.birthDate.value = parsePlainDate('2000-06-15')
      newHire.enabled.value = true
      const { rankCard } = useStanding(ref<QualificationScope>({ base: 'JFK' }))

      expect(rankCard.value).toMatchObject({
        isSimulated: true,
        hypotheticalLabel: 'Hypothetical Placement in JFK',
        rosterSize: 3,
        publicationPilotCount: 2,
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

    it('has no label for a member of the scope', () => {
      outsideScopeRoster()
      const { rankCard } = useStanding(ref<QualificationScope>({ base: 'LAX' }))

      expect(rankCard.value.hypotheticalLabel).toBeNull()
    })

    it('carries no zero-filled figures for a retired Anchor Pilot and keeps the reason', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E1', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 40, employee_number: 'E2', retire_date: '2020-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E2'

    const { rankCard } = useStanding()

    expect(rankCard.value).toMatchObject({
      seniorityNumber: 40,
      rank: null,
      publicationPosition: null,
      rosterSize: null,
      publicationPilotCount: null,
      activePilotCount: null,
      seniorityPercentile: null,
      noResultLabel: 'Anchor Pilot retired',
    })
    expect(rankCard.value).toMatchObject({ rosterSummaryLabel: null, percentileScaleLabel: null })
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
    const { rankCard } = useStanding()
    const originalCard = rankCard.value

    newHire.enabled.value = true
    newHire.selectedBase.value = 'LAX'

    expect(rankCard.value).toEqual(originalCard)
    expect(rankCard.value.isSimulated).toBe(false)
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

  describe('qualification directory', () => {
    function directoryEntries() {
      return [
        makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2045-01-01' }),
        makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2045-01-01' }),
        makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'CA', fleet: '777', retire_date: '2045-01-01' }),
        makeEntry({ seniority_number: 4, employee_number: 'E4', base: 'LAX', seat: 'CA', fleet: '777', retire_date: '2045-01-01' }),
        makeEntry({ seniority_number: 5, employee_number: 'E5', base: 'ORD', seat: 'FO', fleet: '320', retire_date: '2045-01-01' }),
      ]
    }

    it('groups Qualifications by seat, Captains first, highest Seniority Percentile first', () => {
      mockStore.entries = directoryEntries()
      mockUserStore.employeeNumber = 'E3'

      const { qualificationGroups } = useStanding()
      expect(qualificationGroups.value.map(group => group.seatLabel)).toEqual(['Captain', 'First Officer'])
      for (const group of qualificationGroups.value) {
        const percentiles = group.rows.map(row => row.seniorityPercentile)
        expect(percentiles).toEqual([...percentiles].sort((a, b) => b - a))
      }
      expect(qualificationGroups.value[0]!.rows.map(row => row.baseFleetLabel).sort()).toEqual(['JFK 737', 'LAX 777'])
    })

    it('formats Rank, "of N" and percentile with one decimal, and labels Hypothetical Placement', () => {
      mockStore.entries = directoryEntries()
      mockUserStore.employeeNumber = 'E3'

      const { qualificationGroups } = useStanding()
      const own = qualificationGroups.value[0]!.rows.find(row => row.isAnchorCurrentQualification)!
      expect(own).toMatchObject({ baseFleetLabel: 'LAX 777', rankLabel: '1', rosterOfLabel: 'of 2', hypotheticalLabel: null })
      expect(own.percentileLabel).toMatch(/^\d+\.\d%$/)

      const other = qualificationGroups.value[0]!.rows.find(row => row.baseFleetLabel === 'JFK 737')!
      expect(other.hypotheticalLabel).toMatch(/^Hypothetical Placement in /)
    })

    it('returns no groups without an Anchor Pilot', () => {
      mockStore.entries = directoryEntries()
      mockUserStore.employeeNumber = 'UNKNOWN'
      expect(useStanding().qualificationGroups.value).toEqual([])
    })
  })

  describe('figures', () => {
    const RETIREMENTS = 'Retirements senior to you (next 12 months)'

    it('lists the one headline figure set', () => {
      const sixMonthsFromNow = todayPlainDate().add({ months: 6 }).toString()
      mockStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: 'E1', retire_date: sixMonthsFromNow }),
        makeEntry({ seniority_number: 2, employee_number: 'E2', retire_date: '2045-01-01' }),
        makeEntry({ seniority_number: 3, employee_number: 'E3', retire_date: sixMonthsFromNow }),
        makeEntry({ seniority_number: 4, employee_number: 'E4', retire_date: '2045-01-01' }),
      ]
      mockUserStore.employeeNumber = 'E2'

      // E1 and E3 retire within 12 months; only E1 is senior to the Anchor Pilot.
      expect(useStanding().figures.value).toEqual([
        { label: 'Rank', value: '2' },
        { label: 'Seniority Number', value: '2' },
        { label: 'Roster Size', value: '4' },
        { label: 'Seniority Percentile', value: '75.0%' },
        { label: 'Active pilots', value: '4' },
        { label: RETIREMENTS, value: '1' },
      ])
    })

    it('carries the Roster Size trend when the Anchor Pilot is placed into the scope', () => {
      mockStore.entries = [
        makeEntry({ seniority_number: 10, employee_number: 'E1', base: 'JFK', retire_date: '2050-01-01' }),
        makeEntry({ seniority_number: 40, employee_number: 'E2', base: 'LAX', retire_date: '2050-01-01' }),
        makeEntry({ seniority_number: 50, employee_number: 'E3', base: 'JFK', retire_date: '2050-01-01' }),
      ]
      mockUserStore.employeeNumber = 'E2'

      const rosterSize = useStanding(ref<QualificationScope>({ base: 'JFK' })).figures.value.find(f => f.label === 'Roster Size')
      expect(rosterSize).toEqual({ label: 'Roster Size', value: '3', note: 'includes you' })
    })

    it('uses placeholders, not zero, for a retired Anchor Pilot', () => {
      mockStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: 'E1', retire_date: '2020-01-01' }),
        makeEntry({ seniority_number: 2, employee_number: 'E2', retire_date: '2045-01-01' }),
      ]
      mockUserStore.employeeNumber = 'E1'

      const values = Object.fromEntries(useStanding().figures.value.map(f => [f.label, f.value]))
      expect(values).toMatchObject({ Rank: '--', 'Roster Size': '--', 'Seniority Percentile': '--', 'Active pilots': '--', [RETIREMENTS]: '--' })
    })

    it('is empty without an Anchor Pilot', () => {
      expect(useStanding().figures.value).toEqual([])
    })
  })
})
