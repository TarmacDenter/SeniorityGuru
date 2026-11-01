import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'
import { useScenario } from '~/composables/useScenario'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import ProjectionTab from './ProjectionTab.vue'

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

async function mountProjection() {
  const userFound = useSeniorityCore().hasAnchor.value
  const wrapper = await mountSuspended(
    defineComponent({ render: () => h(UApp, null, () => h(ProjectionTab, { loading: false, hasData: true, userFound })) }),
    { global: { stubs: { DashboardChart: true } } },
  )
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
  useScenario().scopeLabel.value = 'Company-wide'
  useState('trajectoryCompareScopeLabel').value = undefined
  seedRoster()
})

describe('Trajectory › Projection', () => {
  it('says once, as an end point, that the trajectory stops at the Anchor Pilot retirement', async () => {
    const wrapper = await mountProjection()

    expect(wrapper.findAll('[data-testid="trajectory-ended-by"]').map(item => item.text())).toEqual(['Projection ends at your retirement'])
    expect(wrapper.text()).not.toContain('Anchor Pilot retired')
  })

  it('names the Roster Size the Seniority Percentile is measured against', async () => {
    useScenario().scopeLabel.value = 'BOS FO 320'
    const wrapper = await mountProjection()

    expect(wrapper.text()).toContain('Percentile measured against Roster Size 2 · Active pilots 2')
  })

  it('shows one yearly-change table, scoped by the scenario, with its best year', async () => {
    useScenario().scopeLabel.value = 'BOS FO 320'
    const wrapper = await mountProjection()

    expect(wrapper.text()).toContain('Yearly change — BOS FO 320')
    expect(wrapper.text()).toMatch(/Best year: 2034 \(\+\d+\.\dpp\)/)
    const rows = wrapper.findAll('[data-testid="yearly-change"] tbody tr').map(row => row.findAll('td').map(td => td.text()))
    expect(rows.length).toBeGreaterThan(1)
    for (const [year, change, percentile] of rows) {
      expect(year).toMatch(/^\d{4}/)
      expect(change).toMatch(/^[+-]?\d+\.\d pp$/)
      expect(percentile).toMatch(/^\d+\.\d%$/)
    }
    expect(wrapper.text()).not.toContain('Key changes')
    expect(wrapper.text()).not.toContain('Improvement Rate')
  })

  it('offers the scope overlay on the chart instead of a separate Seniority Projection', async () => {
    useState('trajectoryCompareScopeLabel').value = 'JFK CA 737'
    const wrapper = await mountProjection()

    expect(wrapper.text()).toContain('Compare with')
    expect(wrapper.text()).toContain('Hypothetical Placement in JFK CA 737')
    expect(wrapper.text()).not.toContain('Seniority Projection')
  })

  it('shows the Percentile Threshold calculator named for the scope', async () => {
    useScenario().scopeLabel.value = 'BOS FO 320'
    const wrapper = await mountProjection()

    expect(wrapper.text()).toContain('Percentile Threshold — BOS FO 320')
    expect(wrapper.text()).toContain('Target percentile')
  })

  it('shows a dismissible note of what the projection assumes', async () => {
    const wrapper = await mountProjection()
    expect(wrapper.text()).toContain('Projection Assumptions')

    const dismiss = wrapper.findAll('button').find(button => button.text() === 'Dismiss')!
    await dismiss.trigger('click')
    expect(wrapper.text()).not.toContain('Projection Assumptions')
    expect(wrapper.text()).toContain('Projections based on scheduled retirements only.')
    expect(mockUserStore.savePreference).toHaveBeenCalledWith('trajectoryAssumptionsDismissed', true)
  })

  it('leaves retirements to Trajectory › Retirements and the Qualification scale to Holdability', async () => {
    const wrapper = await mountProjection()

    expect(wrapper.text()).not.toContain('Retirement Snapshot')
    expect(wrapper.text()).not.toContain('Retirement Projections')
    expect(wrapper.text()).not.toContain('Seniority Position by Qual')
  })

  it('shows only the empty state, asking for an employee number, without an Anchor Pilot', async () => {
    mockUserStore.employeeNumber = null
    const wrapper = await mountProjection()

    expect(wrapper.text()).toContain('No trajectory yet')
    expect(wrapper.text()).toContain('Enter your employee number')
    for (const text of ['Yearly change', 'Percentile Threshold', 'Projection Assumptions', 'Compare with', 'Percentile measured against']) {
      expect(wrapper.text()).not.toContain(text)
    }
  })
})
