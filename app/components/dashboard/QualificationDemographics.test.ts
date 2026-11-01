import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import QualificationDemographics from './QualificationDemographics.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' }, Line: { template: '<div />' }, Doughnut: { template: '<div />' } }))

const { makeEntry } = await import('~/test-utils/factories')

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
  mockStore.entries = [
    makeEntry({ employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    makeEntry({ employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    makeEntry({ employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2050-01-01' }),
  ]
  mockUserStore.employeeNumber = 'E1'
})

async function mountReady() {
  const wrapper = await mountSuspended(QualificationDemographics)
  await new Promise(resolve => setTimeout(resolve, 10))
  await flushPromises()
  return wrapper
}

describe('Qualification demographics', () => {
  it('shows the filter bar and each demographics section by name', async () => {
    const wrapper = await mountReady()
    const text = wrapper.text()

    expect(text).toContain('All Fleets')
    for (const heading of ['Most Junior Captain by Qual', 'Qual Composition', 'Age Distribution', 'Years of Service']) {
      expect(text).toContain(heading)
    }
    expect(text).toContain('737 CA')
    expect(text).toContain('777 FO')
  })

  it('narrows the composition and titles the charts when a base is chosen', async () => {
    const wrapper = await mountReady()

    wrapper.findComponent({ name: 'AnalyticsQualFilterBar' }).vm.$emit('update:base', 'LAX')
    await flushPromises()

    expect(wrapper.text()).toContain('777 FO')
    expect(wrapper.text()).not.toContain('737 CA')
    expect(wrapper.text()).toMatch(/Age Distribution\s+—\s+LAX/)
  })

  it('explains the projection assumptions and lets a pilot dismiss them', async () => {
    const wrapper = await mountReady()
    expect(wrapper.text()).toContain('Projection Assumptions')

    await wrapper.findAll('button').find(button => button.text() === 'Dismiss')!.trigger('click')
    expect(wrapper.text()).not.toContain('Projection Assumptions')
    expect(wrapper.text()).toContain('Projections based on scheduled retirements only.')
  })
})
