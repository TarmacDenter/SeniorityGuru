import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { UApp } from '#components'
import { useScenario } from '~/composables/useScenario'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { useTrajectory } from '~/composables/seniority/modules/useTrajectory'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import NextTab from './NextTab.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

function harness() {
  return defineComponent({
    setup() {
      const { chartData, endedByLabel, keyChanges, hypotheticalLabel } = useTrajectory(undefined, ref({}))
      return () => h(UApp, null, () => h(NextTab, {
        loading: false,
        hasData: true,
        userFound: true,
        chartData: chartData.value,
        endedByLabel: endedByLabel.value,
        keyChanges: keyChanges.value,
        hypotheticalLabel: hypotheticalLabel.value,
      }))
    },
  })
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
  useScenario().scopeLabel.value = 'Company-wide'
})

describe('Next panel', () => {
  it('says once that the trajectory ends at the Anchor Pilot retirement', async () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', retire_date: '2035-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E2'
    const wrapper = await mountSuspended(harness(), { global: { stubs: { DashboardChart: true } } })

    expect(wrapper.findAll('[data-testid="trajectory-ended-by"]').map(item => item.text())).toEqual(['Anchor Pilot retired'])
  })

  it('lists the key changes with year, change and Seniority Percentile', async () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', retire_date: '2032-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', retire_date: '2036-06-15' }),
      makeEntry({ seniority_number: 3, employee_number: 'E3', retire_date: '2040-06-15' }),
    ]
    mockUserStore.employeeNumber = 'E3'
    const wrapper = await mountSuspended(harness(), { global: { stubs: { DashboardChart: true } } })

    expect(wrapper.text()).toContain('Key changes')
    const cells = wrapper.findAll('section[aria-labelledby="key-changes-heading"] tbody tr').map(row => row.findAll('td').map(td => td.text()))
    expect(cells.length).toBeGreaterThan(0)
    for (const [year, change, percentile] of cells) {
      expect(year).toMatch(/^\d{4}$/)
      expect(change).toMatch(/^[+-]?\d+\.\d pp$/)
      expect(percentile).toMatch(/^\d+\.\d%$/)
    }
  })
})

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

const mountNext = () => mountSuspended(harness(), { global: { stubs: { DashboardChart: true, AnalyticsRetirementWaveChart: true } } })

describe('Next panel: restored analysis', () => {
  it('shows the retirement snapshot for the Anchor Pilot', async () => {
    seedRoster()
    const wrapper = await mountNext()

    expect(wrapper.text()).toContain('Retirement Snapshot')
    expect(wrapper.text()).toContain('Jun 2045')
    expect(wrapper.text()).toContain('Roster Size today')
    expect(wrapper.text()).toContain('Final years')
  })

  it('labels the retirement snapshot a Hypothetical Placement when the scope excludes the Anchor Pilot', async () => {
    seedRoster()
    useScenario().scopeLabel.value = 'JFK CA 737'
    const wrapper = await mountNext()

    expect(wrapper.get('[data-testid="snapshot-hypothetical"]').text()).toContain('Hypothetical Placement in')
  })

  it('shows the retirement wave and Percentile Threshold named for the scope', async () => {
    seedRoster()
    useScenario().scopeLabel.value = 'BOS FO 320'
    const wrapper = await mountNext()

    expect(wrapper.text()).toContain('Retirement Wave \u2014 BOS FO 320')
    expect(wrapper.text()).toContain('Percentile Threshold \u2014 BOS FO 320')
    expect(wrapper.text()).toContain('Target percentile')
  })

  it('shows retirement projections, the seniority comparison and the improvement rate', async () => {
    seedRoster()
    const wrapper = await mountNext()

    expect(wrapper.text()).toContain('Retirement Projections')
    expect(wrapper.text()).toContain('Seniority Projection')
    expect(wrapper.text()).toContain('Improvement Rate')
    expect(wrapper.text()).toMatch(/Best year: \d{4} \(\+\d+\.\d+pp\)/)
  })

  it('compares the Anchor Pilot across Qualifications and projects forward on request', async () => {
    seedRoster()
    const wrapper = await mountNext()

    expect(wrapper.text()).toContain('Seniority Position by Qual')
    expect(wrapper.text()).toContain('Project forward')
    expect(wrapper.text()).toContain('As of today')

    await wrapper.get('[data-testid="project-forward"] button[role="switch"]').trigger('click')
    expect(wrapper.get('[data-testid="project-forward"]').text()).toContain('On')
    expect(wrapper.text()).toContain('+1yr')
    expect(wrapper.text()).not.toContain('As of today')
  })

  it('explains how Holdable is modeled', async () => {
    seedRoster()
    const wrapper = await mountNext()

    expect(wrapper.text()).toContain('About this view')
  })

  it('shows the Anchor Pilot retired message instead of the comparison', async () => {
    seedRoster()
    mockStore.entries[0] = makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2020-06-15' })
    mockUserStore.employeeNumber = 'E1'
    const wrapper = await mountNext()

    expect(wrapper.text()).not.toContain('Retirement Snapshot')
  })
})
