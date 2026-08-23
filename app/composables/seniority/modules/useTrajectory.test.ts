import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityCore, _resetCoreSingletons } from './useSeniorityCore'
import { useTrajectory } from './useTrajectory'
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

describe('useTrajectory', () => {
  it('returns empty chartData when lens is null', () => {
    const { chartData } = useTrajectory()
    expect(chartData.value).toEqual({ labels: [], data: [] })
  })

  it('computes chartData through the resolved projection end date', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E2'

    const { chartData } = useTrajectory()
    expect(chartData.value.labels.length).toBeGreaterThan(0)
    expect(chartData.value.data.length).toBeGreaterThan(0)
    expect(chartData.value.labels.length).toBe(chartData.value.data.length)
  })

  it('computes fullTrajectory points', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E2'

    const { fullTrajectory } = useTrajectory()
    expect(fullTrajectory.value.length).toBeGreaterThan(0)
    // Each point should have at least a date and percentile
    const point = fullTrajectory.value[0]!
    expect(point).toHaveProperty('date')
    expect(point).toHaveProperty('percentile')
  })

  it('computes presented trajectory changes', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2030-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E3'

    const { changes } = useTrajectory()
    expect(changes.value.length).toBeGreaterThan(0)
    const change = changes.value[0]!
    expect(change).toHaveProperty('date')
    expect(change).toHaveProperty('percentilePointChange')
    expect(change).toHaveProperty('isPeak')
  })

  it('computeRetirementProjection delegates to lens with scoped scenario', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2030-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'CA', fleet: '777', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E3'

    const { computeRetirementProjection } = useTrajectory()

    // Without scope filter
    const result = computeRetirementProjection()
    expect(result).toHaveProperty('labels')
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('scopedPilotCount')
    expect(result.labels.length).toBe(result.data.length)

    // With scope filter
    const filtered = computeRetirementProjection({ seat: 'CA' })
    expect(filtered).toHaveProperty('scopedPilotCount')
    expect(filtered.scopedPilotCount).toBeLessThanOrEqual(result.scopedPilotCount)
  })

  it('computeRetirementProjection returns empty when lens is null', () => {
    const { computeRetirementProjection } = useTrajectory()
    const result = computeRetirementProjection()
    expect(result).toEqual({ labels: [], data: [], scopedPilotCount: 0 })
  })

  it('computeComparativeTrajectory delegates to lens with two scoped scenarios', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2030-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'CA', fleet: '777', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E3'

    const { computeComparativeTrajectory } = useTrajectory()
    const result = computeComparativeTrajectory(
      { seat: 'CA' },
      { base: 'JFK' },
    )
    expect(result).toHaveProperty('labels')
    expect(result).toHaveProperty('baselineData')
    expect(result).toHaveProperty('comparisonData')
    expect(result.labels.length).toBe(result.baselineData.length)
    expect(result.labels.length).toBe(result.comparisonData.length)
  })

  it('computeComparativeTrajectory returns empty when lens is null', () => {
    const { computeComparativeTrajectory } = useTrajectory()
    const result = computeComparativeTrajectory({ seat: 'CA' }, { base: 'JFK' })
    expect(result).toEqual({ labels: [], baselineData: [], comparisonData: [] })
  })

  it('respects custom growthAssumptions when provided', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2030-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E3'

    const growthAssumptions = ref({ enabled: true, annualGrowthRate: 0.05 })
    const { fullTrajectory: withGrowth } = useTrajectory(growthAssumptions)

    const { fullTrajectory: withoutGrowth } = useTrajectory()

    expect(withGrowth.value.length).toBeGreaterThan(0)
    expect(withoutGrowth.value.length).toBeGreaterThan(0)

    // Growth adds pilots to the total, which changes percentile at intermediate points.
    // Compare a mid-trajectory point where the totals diverge.
    const midIdx = Math.floor(withGrowth.value.length / 2)
    const midWithGrowth = withGrowth.value[midIdx]!
    const midWithoutGrowth = withoutGrowth.value[midIdx]!
    // With growth, the total is larger so percentile improvement is dampened
    expect(midWithGrowth.percentile).not.toBe(midWithoutGrowth.percentile)
  })
})
