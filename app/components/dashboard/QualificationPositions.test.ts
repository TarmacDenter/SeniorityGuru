import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import QualificationPositions from './QualificationPositions.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

function seed(anchorRetire: string) {
  mockStore.entries = [
    makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2028-01-01' }),
    makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retire_date: anchorRetire }),
    makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2050-01-01' }),
  ]
  mockUserStore.employeeNumber = 'E2'
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
})

describe('Qualification seniority scale', () => {
  it('shows the Seniority Position by Qual with the Roster Size it is measured against', async () => {
    seed('2050-01-01')
    const wrapper = await mountSuspended(QualificationPositions)

    expect(wrapper.text()).toContain('Seniority Position by Qual')
    expect(wrapper.text()).toContain('737')
    expect(wrapper.text()).toContain('777')
    expect(wrapper.text()).toContain('As of today')
  })

  it('projects forward when the pilot turns on Project forward', async () => {
    seed('2050-01-01')
    const wrapper = await mountSuspended(QualificationPositions)
    expect(wrapper.text()).not.toMatch(/\+\d+\s*yrs?/)

    await wrapper.find('[role="switch"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toMatch(/\+1\s*yr/)
    expect(wrapper.text()).toMatch(/As of \d{4}-\d{2}-\d{2}/)
  })

  it('says why there is no position when the Anchor Pilot has retired', async () => {
    seed('2020-01-01')
    const wrapper = await mountSuspended(QualificationPositions)
    expect(wrapper.text()).toContain('Anchor Pilot retired')
    expect(wrapper.text()).not.toContain('Project forward')
  })
})
