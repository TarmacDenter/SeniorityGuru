import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { useScenario } from '~/composables/useScenario'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import RetirementHeatmap from './RetirementHeatmap.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))
vi.mock('vue-chartjs', () => ({ Chart: { props: ['ariaLabel'], template: '<div role="img" :aria-label="ariaLabel" />' } }))

const { makeEntry } = await import('~/test-utils/factories')

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
  useScenario().scopeLabel.value = 'Company-wide'
})

describe('Retirement heatmap', () => {
  it('asks for a list when none is loaded', async () => {
    const wrapper = await mountSuspended(RetirementHeatmap)
    expect(wrapper.text()).toContain('No seniority list loaded')
  })

  it('shows the scope, grouping, and pilots it cannot place, and regroups on demand', async () => {
    mockStore.entries = [
      makeEntry({ employee_number: 'E1', base: 'JFK', seat: 'CA', retire_date: '2050-01-01' }),
      makeEntry({ employee_number: 'E2', base: 'LAX', seat: 'FO', retire_date: undefined }),
    ]
    const wrapper = await mountSuspended(RetirementHeatmap)
    expect(wrapper.text()).toContain('Company-wide · By base')
    expect(wrapper.text()).toContain('1 active pilot has no retirement date and is not shown.')

    const seat = wrapper.findAll('button').find(button => button.text() === 'Seat')!
    await seat.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Company-wide · By base, seat')
    expect(seat.attributes('aria-pressed')).toBe('true')
  })
})
