import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { UApp } from '#components'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { useStanding } from '~/composables/seniority/modules/useStanding'
import { useListExcerpt } from '~/composables/seniority/modules/useListExcerpt'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import type { QualificationScope } from '~/utils/seniority'
import MyStatusTab from './MyStatusTab.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' }, Line: { template: '<div />' }, Doughnut: { template: '<div />' } }))

const { makeEntry } = await import('~/test-utils/factories')

/** Feeds the Now panel from the real composables, the way the dashboard page does. */
function harness(scope: ReturnType<typeof ref<QualificationScope>>) {
  return defineComponent({
    setup() {
      const { rankCard, figures } = useStanding(scope as any)
      const { rows } = useListExcerpt(2)
      return () => h(UApp, null, () => h(MyStatusTab, {
        loading: false,
        hasData: true,
        hasEmployeeNumber: true,
        userFound: true,
        isNewHireMode: false,
        rankCard: rankCard.value,
        figures: figures.value,
        excerptRows: rows.value,
      }))
    },
  })
}

function figureValue(wrapper: Awaited<ReturnType<typeof mountSuspended>>, label: string): string {
  const item = wrapper.findAll('[data-testid="standing-figures"] > div').find((div: { find: (s: string) => { text: () => string } }) => div.find('dt').text() === label)
  return item!.find('dd').text()
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
})

describe('Now panel', () => {
  it('shows the Roster Size that follows the Qualification Scope', async () => {
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
    expect(figureValue(wrapper, 'Roster Size')).toBe('5')

    // JFK FO 320 holds E1, E2; the Anchor Pilot E3 is modeled into it: 3.
    scope.value = { base: 'JFK', seat: 'FO', fleet: '320' }
    await wrapper.vm.$nextTick()
    expect(figureValue(wrapper, 'Roster Size')).toBe('3')
    expect(wrapper.text()).toContain('Hypothetical Placement in JFK FO 320')
  })

  it('marks the pilot line among its neighbors and lists the Standing figures', async () => {
    mockStore.entries = [1, 2, 3, 4, 5].map(n => makeEntry({ seniority_number: n * 10, employee_number: `E${n}`, name: `Pilot ${n}`, retire_date: '2050-01-01' }))
    mockUserStore.employeeNumber = 'E3'
    const wrapper = await mountSuspended(harness(ref<QualificationScope>({})))

    expect(wrapper.find('table caption').text()).toBe('Seniority List around your line')
    const rows = wrapper.findAll('tbody tr')
    expect(rows.map(row => row.find('td').text())).toEqual(['10', '20', '30', '40', '50'])
    expect(rows.map(row => row.find('td:nth-child(2)').text())).toEqual(['Pilot 1', 'Pilot 2', 'Pilot 3 (Your line)', 'Pilot 4', 'Pilot 5'])
    expect(rows.filter(row => row.text().includes('Your line')).map(row => row.find('td').text())).toEqual(['30'])
    expect(figureValue(wrapper, 'Rank')).toBe('3')
    expect(figureValue(wrapper, 'Seniority Number')).toBe('30')
    expect(figureValue(wrapper, 'Seniority Percentile')).toBe('60.0%')
    expect(figureValue(wrapper, 'Active pilots')).toBe('5')
  })

  it('labels a retired neighbor in the excerpt', async () => {
    mockStore.entries = [1, 2, 3].map(n => makeEntry({ seniority_number: n * 10, employee_number: `E${n}`, name: `Pilot ${n}`, retire_date: n === 1 ? '2020-01-01' : '2050-01-01' }))
    mockUserStore.employeeNumber = 'E2'
    const wrapper = await mountSuspended(harness(ref<QualificationScope>({})))

    const retired = wrapper.findAll('tbody tr').filter(row => row.text().includes('retired'))
    expect(retired.map(row => row.find('td').text())).toEqual(['10'])
  })

  it('renders placeholders, never zero, when the Anchor Pilot has retired', async () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'E1', retire_date: '2020-01-01' }),
      makeEntry({ seniority_number: 2, employee_number: 'E2', retire_date: '2050-01-01' }),
    ]
    mockUserStore.employeeNumber = 'E1'
    const wrapper = await mountSuspended(harness(ref<QualificationScope>({})))

    expect(wrapper.text()).toContain('Anchor Pilot retired')
    expect(figureValue(wrapper, 'Rank')).toBe('--')
    expect(figureValue(wrapper, 'Roster Size')).toBe('--')
    expect(figureValue(wrapper, 'Seniority Percentile')).toBe('--')
  })

  describe('detail restored from the old My Status tab', () => {
    function seedFive() {
      mockStore.entries = [1, 2, 3, 4, 5].map(n => makeEntry({ seniority_number: n * 10, employee_number: `E${n}`, name: `Pilot ${n}`, retire_date: n === 1 ? '2027-01-01' : '2050-01-01' }))
      mockUserStore.employeeNumber = 'E3'
    }

    it('lists the retirements, base rank and list count beside the Standing figures', async () => {
      seedFive()
      const wrapper = await mountSuspended(harness(ref<QualificationScope>({})))

      const glance = wrapper.find('[data-testid="standing-glance"]')
      expect(glance.exists()).toBe(true)
      expect(glance.text()).toContain('Retirements (Next 12 mo.)')
      expect(glance.text()).toContain('Your Base Rank')
      expect(glance.text()).toContain('Lists Uploaded')
    })

    it('keeps Status by Base / Seat / Fleet behind a disclosure', async () => {
      seedFive()
      const wrapper = await mountSuspended(harness(ref<QualificationScope>({})))
      expect(wrapper.text()).not.toContain('Status by Base / Seat / Fleet')

      const toggle = wrapper.findAll('button').find(button => button.text().includes('More detail'))!
      await toggle.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Status by Base / Seat / Fleet')

      expect(wrapper.find('a[href="/dashboard/current/holdability"]').text()).toContain('Open Holdability')
    })
  })
})
