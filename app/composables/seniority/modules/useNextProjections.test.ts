import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useSeniorityCore, _resetCoreSingletons } from './useSeniorityCore'
import { useNextProjections } from './useNextProjections'
import { useScenario } from '~/composables/useScenario'
import { resetMockStores } from '~/test-utils/seniority-mocks'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

function seedRoster() {
  mockStore.entries = [
    makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2030-06-15' }),
    makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2032-06-15' }),
    makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'BOS', seat: 'FO', fleet: '320', retire_date: '2034-06-15' }),
    makeEntry({ seniority_number: 4, employee_number: 'E4', base: 'BOS', seat: 'FO', fleet: '320', retire_date: '2045-06-15' }),
    makeEntry({ seniority_number: 5, employee_number: 'E5', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2046-06-15' }),
  ]
  mockUserStore.employeeNumber = 'E4'
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
  const { scopeLabel, growthAssumptions } = useScenario()
  scopeLabel.value = 'Company-wide'
  growthAssumptions.value = { enabled: false, annualGrowthRate: 0.02 }
  useState('trajectoryCompareScopeLabel').value = undefined
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useNextProjections: project forward', () => {
  it('shows positions as of today until Project forward is turned on', () => {
    seedRoster()
    const projections = useNextProjections()

    expect(projections.asOfLabel.value).toBe('As of today')
    expect(projections.sliderMax.value).toBeGreaterThan(1)
  })

  it('offers no slider range when there is no Anchor Pilot', () => {
    const projections = useNextProjections()

    expect(projections.sliderMax.value).toBe(0)
    expect(projections.canProjectForward.value).toBe(false)
  })

  it('moves the As-of label a year ahead when Project forward is turned on', async () => {
    seedRoster()
    const projections = useNextProjections()
    const nextYear = new Date().getFullYear() + 1

    projections.projectForward.value = true
    await nextTick()

    expect(projections.asOfLabel.value).toMatch(new RegExp(`^As of ${nextYear}-\\d{2}-\\d{2}$`))
    expect(projections.yearsLabel.value).toBe('+1yr')
  })

  it('waits half a second after the slider stops before projecting', async () => {
    vi.useFakeTimers()
    seedRoster()
    const projections = useNextProjections()
    projections.projectForward.value = true
    await nextTick()

    projections.yearsInput.value = 3
    await nextTick()
    expect(projections.yearsLabel.value).toBe('+3yrs')
    expect(projections.projectionYears.value).toBe(1)

    vi.advanceTimersByTime(500)
    expect(projections.projectionYears.value).toBe(3)
  })

  it('returns to today when Project forward is turned off', async () => {
    seedRoster()
    const projections = useNextProjections()
    projections.projectForward.value = true
    await nextTick()
    projections.projectForward.value = false
    await nextTick()

    expect(projections.asOfLabel.value).toBe('As of today')
    expect(projections.projectionYears.value).toBe(0)
  })

  it('compares the Anchor Pilot across Qualifications and shows the roster summary', () => {
    seedRoster()
    const projections = useNextProjections()

    expect(projections.qualificationPositions.value.length).toBeGreaterThan(1)
    expect(projections.rosterSummaryLabel.value).toContain('5')
  })

  it('says why there is no comparison when the Anchor Pilot has retired', () => {
    seedRoster()
    mockStore.entries[0] = makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2020-06-15' })
    mockUserStore.employeeNumber = 'E1'
    const projections = useNextProjections()

    expect(projections.qualificationPositions.value).toEqual([])
    expect(projections.qualificationPositionsNoResultLabel.value).toBe('Anchor Pilot retired')
  })
})

describe('useNextProjections: retirement analysis', () => {
  it('lists the Retirement Wave for the shared Qualification Scope and names the scope', () => {
    seedRoster()
    const projections = useNextProjections()
    expect(projections.retirementWave.value.length).toBeGreaterThan(0)
    expect(projections.scopeSuffix.value).toBe('')

    useScenario().scopeLabel.value = 'JFK CA 737'
    expect(projections.scopeSuffix.value).toBe(' — JFK CA 737')
  })

  it('keeps the Percentile Threshold target inside the trajectory and finds the year it is reached', () => {
    seedRoster()
    const projections = useNextProjections()

    const { target, min, max } = projections.threshold
    expect(target.value).toBeGreaterThanOrEqual(min.value)
    expect(target.value).toBeLessThanOrEqual(max.value)
    target.value = max.value
    expect(projections.threshold.result.value?.year).toMatch(/^\d{4}/)
  })

  it('presents the retirement snapshot with one-decimal percentiles and the final years only', async () => {
    seedRoster()
    const projections = useNextProjections()
    const snapshot = projections.snapshot.value

    expect(snapshot).not.toBeNull()
    expect(snapshot!.retireDateLabel).toBe('Jun 2045')
    expect(snapshot!.percentileLabel).toMatch(/^\d+\.\d%$/)
    expect(snapshot!.rows.length).toBeLessThanOrEqual(5)
    expect(snapshot!.rows[0]!.percentileLabel).toMatch(/^\d+\.\d%$/)

    projections.snapshotYears.value = 3
    await nextTick()
    expect(projections.snapshot.value!.rows).toHaveLength(3)
  })

  it('has no snapshot without an Anchor Pilot', () => {
    expect(useNextProjections().snapshot.value).toBeNull()
  })

  it('names the best year of improvement', () => {
    seedRoster()
    const projections = useNextProjections()
    expect(projections.bestYearLabel.value).toMatch(/^Best year: \d{4} \(\+\d+(\.\d+)?pp\)$/)
  })

  it('names no best year without improvement data', () => {
    expect(useNextProjections().bestYearLabel.value).toBeNull()
  })
})

describe('useNextProjections: Trajectory › Projection', () => {
  it('overlays the trajectory within another Qualification Scope on the same axes', () => {
    seedRoster()
    const projections = useNextProjections()
    const alone = projections.projectionChart.value
    expect(alone.overlay).toBeNull()
    expect(alone.label).toBe('Company-wide')
    expect(projections.compareScopeItems.value).not.toContain('Company-wide')
    expect(projections.compareScopeItems.value).toContain('JFK CA 737')

    projections.compareScopeLabel.value = 'JFK CA 737'
    const compared = projections.projectionChart.value
    expect(compared.labels).toEqual(alone.labels)
    expect(compared.data).toEqual(alone.data)
    expect(compared.overlay).toMatchObject({
      label: 'JFK CA 737 (Hypothetical Placement)',
      hypotheticalLabel: 'Hypothetical Placement in JFK CA 737',
    })
    expect(compared.overlay!.data).toHaveLength(alone.labels.length)
    expect(compared.overlay!.data).not.toEqual(alone.data)
  })

  it('drops the overlay when it names the scenario scope', () => {
    seedRoster()
    const projections = useNextProjections()
    projections.compareScopeLabel.value = 'BOS FO 320'
    useScenario().scopeLabel.value = 'BOS FO 320'

    expect(projections.projectionChart.value.overlay).toBeNull()
    expect(projections.projectionChart.value.label).toBe('BOS FO 320')
  })

  it('names the Roster Size the scoped projection is measured against', () => {
    seedRoster()
    const projections = useNextProjections()
    expect(projections.percentileScaleLabel.value).toBe('Percentile measured against Roster Size 5 · Active pilots 5')

    useScenario().scopeLabel.value = 'BOS FO 320'
    expect(projections.percentileScaleLabel.value).toBe('Percentile measured against Roster Size 2 · Active pilots 2')
  })

  it('says the scoped trajectory ends at the Anchor Pilot retirement', () => {
    seedRoster()
    useScenario().scopeLabel.value = 'BOS FO 320'
    expect(useNextProjections().endedByLabel.value).toBe('Projection ends at your retirement')
  })
})
