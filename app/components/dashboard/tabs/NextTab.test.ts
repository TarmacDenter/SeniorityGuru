import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { UApp } from '#components'
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
    const cells = wrapper.findAll('section tbody tr').map(row => row.findAll('td').map(td => td.text()))
    expect(cells.length).toBeGreaterThan(0)
    for (const [year, change, percentile] of cells) {
      expect(year).toMatch(/^\d{4}$/)
      expect(change).toMatch(/^[+-]?\d+\.\d pp$/)
      expect(percentile).toMatch(/^\d+\.\d%$/)
    }
  })
})
