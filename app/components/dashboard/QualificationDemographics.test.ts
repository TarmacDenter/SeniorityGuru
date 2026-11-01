import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { useScenario } from '~/composables/useScenario'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import QualificationDemographics from './QualificationDemographics.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' }, Line: { template: '<div />' }, Doughnut: { template: '<div />' } }))

const { makeEntry } = await import('~/test-utils/factories')

// No employee number: Demographics must still read fully.
beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
  useScenario().scopeLabel.value = 'Company-wide'
  mockStore.entries = [
    makeEntry({ employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    makeEntry({ employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    makeEntry({ employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2050-01-01' }),
  ]
})

async function mountReady() {
  const wrapper = await mountSuspended(QualificationDemographics)
  await new Promise(resolve => setTimeout(resolve, 10))
  await flushPromises()
  return wrapper
}

describe('Qualification demographics', () => {
  it('shows every card without an employee number', async () => {
    const wrapper = await mountReady()
    const text = wrapper.text()

    for (const title of ['Sizes', 'Composition', 'Ages', 'Years of service', 'Junior captains']) {
      expect(text).toContain(title)
    }
    expect(text).toContain('737 CA')
    expect(text).toContain('777 FO')
    expect(text).toContain('Median')
    expect(text).not.toContain('You:')
    expect(text).not.toContain('All Fleets')
  })

  it('follows the scenario Qualification Scope', async () => {
    const wrapper = await mountReady()

    useScenario().scopeLabel.value = 'LAX'
    await flushPromises()

    expect(wrapper.text()).toContain('777 FO')
    expect(wrapper.text()).not.toContain('737 CA')
  })

  it('says plainly when the import has no ages', async () => {
    mockStore.entries = mockStore.entries.map(entry => ({ ...entry, retire_date: undefined }))
    const wrapper = await mountReady()

    expect(wrapper.text()).toContain('No ages are available for the pilots in this Qualification Scope.')
    expect(wrapper.text()).toContain('Years of service')
  })
})
