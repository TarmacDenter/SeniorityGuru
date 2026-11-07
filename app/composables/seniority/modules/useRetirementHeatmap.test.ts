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
  for (const dimension of heatmap.dimensions.value) {
    if (dimension.selected !== (dimension.value === 'base')) heatmap.toggleDimension(dimension.value)
  }
  mockStore.entries = [
    makeEntry({ employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    makeEntry({ employee_number: 'E2', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2050-03-01' }),
    makeEntry({ employee_number: 'E3', base: 'LAX', seat: 'CA', fleet: '777', retire_date: '2051-01-01' }),
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
    const jfk2050 = () => heatmap.points.value.find(point => point.y === 'JFK' && point.x === '2050')!
    expect(jfk2050()).toMatchObject({ label: '2', intensity: 1 })

    heatmap.showPercent.value = true
    await nextTick()
    expect(jfk2050()).toMatchObject({ label: '100.0%', intensity: 1 })
    expect(heatmap.valueLegend.value).toContain('Share')
  })
})
