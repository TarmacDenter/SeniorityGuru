import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityCore } from './useSeniorityCore'
import { useTrajectory } from './useTrajectory'

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

const { makeEntry } = await import('~/test-utils/factories')

beforeEach(() => {
  mockStore.entries = []
  mockStore.lists = []
  mockUserStore.employeeNumber = null
  mockUserStore.retirementAge = 65
  const { newHire } = useSeniorityCore()
  newHire.reset()
})

describe('useTrajectory', () => {
  it('returns empty chartData when lens is null', () => {
    const { chartData } = useTrajectory()
    expect(chartData.value).toEqual({ labels: [], data: [] })
  })

  it('computes chartData from lens.trajectory() with default growth config', () => {
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

  it('computes trajectory deltas', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2030-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E3'

    const { deltas } = useTrajectory()
    // Deltas represent year-over-year changes; with retirements ahead there should be entries
    expect(deltas.value.length).toBeGreaterThan(0)
    const delta = deltas.value[0]!
    expect(delta).toHaveProperty('date')
    expect(delta).toHaveProperty('delta')
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
    expect(result).toHaveProperty('filteredTotal')
    expect(result.labels.length).toBe(result.data.length)

    // With scope filter
    const filtered = computeRetirementProjection({ seat: 'CA' })
    expect(filtered).toHaveProperty('filteredTotal')
    expect(filtered.filteredTotal).toBeLessThanOrEqual(result.filteredTotal)
  })

  it('computeRetirementProjection returns empty when lens is null', () => {
    const { computeRetirementProjection } = useTrajectory()
    const result = computeRetirementProjection()
    expect(result).toEqual({ labels: [], data: [], filteredTotal: 0 })
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
    expect(result).toHaveProperty('currentData')
    expect(result).toHaveProperty('compareData')
    expect(result.labels.length).toBe(result.currentData.length)
    expect(result.labels.length).toBe(result.compareData.length)
  })

  it('computeComparativeTrajectory returns empty when lens is null', () => {
    const { computeComparativeTrajectory } = useTrajectory()
    const result = computeComparativeTrajectory({ seat: 'CA' }, { base: 'JFK' })
    expect(result).toEqual({ labels: [], currentData: [], compareData: [] })
  })

  it('respects custom growthConfig when provided', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2030-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E3'

    const growthConfig = ref({ enabled: true, annualRate: 0.05 })
    const { fullTrajectory: withGrowth } = useTrajectory(growthConfig)

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
