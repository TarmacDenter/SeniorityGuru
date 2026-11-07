import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { _resetCoreSingletons, useSeniorityCore } from './useSeniorityCore'
import { useRetirementHeatmap } from './useRetirementHeatmap'
import { useScenario } from '~/composables/useScenario'
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
  useSeniorityCore().newHire.reset()
  useScenario().scopeLabel.value = 'Company-wide'
  const heatmap = useRetirementHeatmap()
  heatmap.showPercent.value = false
  heatmap.sortBy.value = 'qualification'
  heatmap.years.value = 10
  for (const dimension of heatmap.dimensions.value) {
    if (dimension.selected !== (dimension.value === 'base')) heatmap.toggleDimension(dimension.value)
  }
  mockStore.entries = [
    makeEntry({ employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2028-01-01' }),
    makeEntry({ employee_number: 'E2', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2028-03-01' }),
    makeEntry({ employee_number: 'E3', base: 'LAX', seat: 'CA', fleet: '777', retire_date: '2029-01-01' }),
  ]
})

describe('useRetirementHeatmap', () => {
  it('groups by base by default and follows the chosen dimensions', async () => {
    const heatmap = useRetirementHeatmap()
    expect(heatmap.rowLabels.value).toEqual(['JFK', 'LAX'])
    expect(heatmap.groupedByLabel.value).toBe('By base')

    heatmap.toggleDimension('seat')
    await nextTick()
    expect(heatmap.rowLabels.value).toEqual(['JFK CA', 'JFK FO', 'LAX CA'])
    expect(heatmap.groupedByLabel.value).toBe('By base, seat')

    heatmap.toggleDimension('base')
    heatmap.toggleDimension('seat')
    await nextTick()
    expect(heatmap.rowLabels.value).toEqual(['Company-wide'])
    expect(heatmap.groupedByLabel.value).toBe('Whole scope')
  })

  it('filters by the shared Qualification Scope', async () => {
    const heatmap = useRetirementHeatmap()
    useScenario().scopeLabel.value = 'CA'
    await nextTick()
    expect(heatmap.rowLabels.value).toEqual(['JFK', 'LAX'])
    expect(heatmap.rows.value[0]!.totalLabel).toBe('1 retirement')
  })

  it('switches the cell value between a count and a share of the group', async () => {
    const heatmap = useRetirementHeatmap()
    const jfk2050 = () => heatmap.points.value.find(point => point.y === 'JFK' && point.x === '2028')!
    expect(jfk2050()).toMatchObject({ label: '2', intensity: 1 })

    heatmap.showPercent.value = true
    await nextTick()
    expect(jfk2050()).toMatchObject({ label: '100.0%', intensity: 1 })
    expect(heatmap.valueLegend.value).toContain('Share')
  })
  it('orders rows by Base, Fleet, Seat by default and by retirements or % on request', async () => {
    mockStore.entries = [
      makeEntry({ employee_number: 'A', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2028-01-01' }),
      makeEntry({ employee_number: 'B', base: 'JFK', seat: 'CA', fleet: '777', retire_date: '2028-01-01' }),
      makeEntry({ employee_number: 'C', base: 'JFK', seat: 'CA', fleet: '777', retire_date: '2028-01-01' }),
      makeEntry({ employee_number: 'D', base: 'JFK', seat: 'CA', fleet: '777', retire_date: '2060-01-01' }),
      makeEntry({ employee_number: 'E', base: 'BOS', seat: 'CA', fleet: '737', retire_date: '2060-01-01' }),
    ]
    const heatmap = useRetirementHeatmap()
    heatmap.toggleDimension('seat')
    heatmap.toggleDimension('fleet')
    await nextTick()
    expect(heatmap.rowLabels.value).toEqual(['BOS CA 737', 'JFK FO 737', 'JFK CA 777'])

    heatmap.sortBy.value = 'retirements'
    await nextTick()
    expect(heatmap.rowLabels.value).toEqual(['JFK CA 777 · 2', 'JFK FO 737 · 1', 'BOS CA 737 · 0'])

    heatmap.sortBy.value = 'percent'
    await nextTick()
    expect(heatmap.rowLabels.value).toEqual(['JFK FO 737 · 100.0%', 'JFK CA 777 · 66.7%', 'BOS CA 737 · 0.0%'])
    expect(heatmap.summaryLabel.value).toContain('sorted by Highest % of group')
  })

  it('shows ten years by default, up to the last scheduled retirement', async () => {
    mockStore.entries = [makeEntry({ employee_number: 'A', retire_date: '2060-01-01' })]
    const heatmap = useRetirementHeatmap()
    expect(heatmap.yearLabels.value).toHaveLength(10)
    expect(heatmap.maxYears.value).toBe(2060 - new Date().getFullYear() + 1)
    expect(heatmap.isEmpty.value).toBe(true)

    heatmap.years.value = heatmap.maxYears.value
    await nextTick()
    expect(heatmap.yearLabels.value.at(-1)).toBe('2060')
    expect(heatmap.isEmpty.value).toBe(false)
  })
})
