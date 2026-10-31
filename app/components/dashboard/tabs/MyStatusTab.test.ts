import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { UApp } from '#components'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { useStanding } from '~/composables/seniority/modules/useStanding'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import type { QualificationScope } from '~/utils/seniority'
import DashboardStatCard from '../DashboardStatCard.vue'
import MyStatusTab from './MyStatusTab.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

vi.mock('~/components/dashboard/TrajectoryChart.vue', () => ({ default: { template: '<div />' } }))

const { makeEntry } = await import('~/test-utils/factories')

/** Feeds MyStatusTab from the real useStanding, the way the dashboard page does. */
function harness(scope: ReturnType<typeof ref<QualificationScope>>) {
  return defineComponent({
    setup() {
      const { rankCard, statCards, retirementSnapshot, baseStatus } = useStanding(scope as any)
      return () => h(UApp, null, () => h(MyStatusTab, {
        loading: false,
        hasData: true,
        hasEmployeeNumber: true,
        userFound: true,
        isNewHireMode: false,
        scopeLabels: ['Company-wide'],
        rankCard: rankCard.value,
        stats: statCards.value,
        retirementSnapshot: retirementSnapshot.value,
        trajectoryChanges: [],
        baseStatusData: baseStatus.value,
        trajectoryChartData: { labels: [], data: [] },
      }))
    },
  })
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
})

describe('MyStatusTab Roster Size', () => {
  it('shows the same Roster Size on the stat card and the Rank card under a Qualification Scope', async () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 10, employee_number: 'E1', base: 'JFK', seat: 'FO', fleet: '320', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 20, employee_number: 'E2', base: 'JFK', seat: 'FO', fleet: '320', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 30, employee_number: 'E3', base: 'BOS', seat: 'CA', fleet: '220', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 40, employee_number: 'E4', base: 'BOS', seat: 'CA', fleet: '220', retire_date: '2050-01-01' }),
      makeEntry({ seniority_number: 50, employee_number: 'E5', base: 'ORD', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E3'
    const scope = ref<QualificationScope>({})
    const wrapper = await mountSuspended(harness(scope))
    const companyWide = wrapper.get('[data-testid="roster-size"]').findAll('p')[1]!.text()
    expect(companyWide).toBe('5')

    const statCardRoster = () => wrapper.findAllComponents(DashboardStatCard)[0]!.props('value')
    const rankCardRoster = () => wrapper.get('[data-testid="roster-size"]').findAll('p')[1]!.text()
    expect(statCardRoster()).toBe(companyWide)

    for (const next of [{ base: 'JFK', seat: 'FO', fleet: '320' }, { base: 'BOS', seat: 'CA', fleet: '220' }, { base: 'ORD' }]) {
      scope.value = next
      await wrapper.vm.$nextTick()
      expect(statCardRoster()).toBe(rankCardRoster())
    }
    // JFK FO 320 holds E1, E2; the Anchor Pilot E3 is modeled into it: 3.
    scope.value = { base: 'JFK', seat: 'FO', fleet: '320' }
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="roster-size"]').findAll('p')[1]!.text()).toBe('3')
  })
})
