import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'
import { useScenario } from '~/composables/useScenario'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import TrajectoryRetirementsTab from './TrajectoryRetirementsTab.vue'

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

function mountRetirements(props: { userFound?: boolean } = {}) {
  const harness = defineComponent({
    setup: () => () => h(UApp, null, () => h(TrajectoryRetirementsTab, { loading: false, hasData: true, userFound: props.userFound ?? true })),
  })
  return mountSuspended(harness, { global: { stubs: { DashboardChart: true, AnalyticsRetirementWaveChart: true } } })
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
  useScenario().scopeLabel.value = 'Company-wide'
})

describe('Trajectory › Retirements', () => {
  it('reads the count of retirements senior to the Anchor Pilot in the next N years', async () => {
    seedRoster()
    const wrapper = await mountRetirements()

    expect(wrapper.text()).toMatch(/\d+ retirements? senior to you in the next (year|\d+ years)/)
    expect(wrapper.text()).toContain('Retirements within')
  })

  it('updates the count after the slider rests', async () => {
    seedRoster()
    const wrapper = await mountRetirements()
    const before = wrapper.get('[aria-live="polite"]').text()
    const thumb = wrapper.get('[role="slider"]')
    await thumb.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe(before)
    await vi.waitFor(() => expect(wrapper.get('[aria-live="polite"]').text()).not.toBe(before))
  })

  it('keeps the Retirement Wave after the Anchor Pilot retires', async () => {
    seedRoster()
    mockStore.entries = mockStore.entries.map(entry => entry.employee_number === 'E4'
      ? { ...entry, retire_date: makeEntry({ retire_date: '2020-01-01' }).retire_date }
      : entry)
    const wrapper = await mountRetirements()
    expect(wrapper.text()).toContain('Retirement Wave')
    expect(wrapper.find('analytics-retirement-wave-chart-stub').exists()).toBe(true)
  })

  it('no longer shows the Retirement Snapshot', async () => {
    seedRoster()
    const wrapper = await mountRetirements()

    expect(wrapper.text()).not.toContain('Retirement Snapshot')
    expect(wrapper.text()).not.toContain('Final years')
  })

  it('shows the Retirement Wave named for the scope and the Retirement Projections', async () => {
    seedRoster()
    useScenario().scopeLabel.value = 'BOS FO 320'
    const wrapper = await mountRetirements()

    expect(wrapper.text()).toContain('Retirement Wave — BOS FO 320')
    expect(wrapper.text()).toContain('Retirement Projections')
    expect(wrapper.text()).not.toContain('Percentile Threshold')
  })

  it('asks for an Anchor Pilot before showing anything', async () => {
    const wrapper = await mountRetirements({ userFound: false })
    expect(wrapper.text()).toContain('No trajectory yet')
    expect(wrapper.text()).not.toContain('Retirement Projections')
  })
})
