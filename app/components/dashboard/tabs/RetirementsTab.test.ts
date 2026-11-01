import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { resetMockStores } from '~/test-utils/seniority-mocks'
import { Temporal } from '~/utils/temporal'
import RetirementsTab from './RetirementsTab.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

const inMonths = (months: number) => Temporal.Now.plainDateISO().add({ months }).toString()
const pilot = (n: number, months: number) => makeEntry({ seniority_number: n, employee_number: `E${n}`, name: `Pilot ${n}`, retire_date: inMonths(months) })

async function mountTab() {
  return mountSuspended(defineComponent({ setup: () => () => h(UApp, null, () => h(RetirementsTab)) }))
}

const bodyRows = (wrapper: Awaited<ReturnType<typeof mountTab>>) => wrapper.findAll('tbody tr').map(tr => tr.text())

describe('RetirementsTab', () => {
  beforeEach(() => {
    _resetCoreSingletons()
    resetMockStores(mockStore, mockUserStore)
    useSeniorityCore().newHire.reset()
  })

  it('shows an empty state with an import link when no list is loaded', async () => {
    const wrapper = await mountTab()
    expect(wrapper.text()).toContain('No seniority list loaded')
    expect(wrapper.find('a[href="/seniority/upload"]').exists()).toBe(true)
  })

  it('lists upcoming retirements by date and asks for an employee number', async () => {
    mockStore.entries = [pilot(1, 18), pilot(2, 6), pilot(3, 600)]
    const wrapper = await mountTab()
    const rows = bodyRows(wrapper)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toContain(inMonths(6))
    expect(rows[1]).toContain(inMonths(18))
    expect(wrapper.text()).toContain('Set an employee number that appears in this list')
    expect(wrapper.findAll('thead th').map(th => th.text())).not.toContain('Rank relative to me')
    expect(wrapper.get('[role="switch"]').attributes('disabled')).toBeDefined()
  })

  it('re-sorts when the Seniority Number heading is pressed', async () => {
    mockStore.entries = [pilot(1, 18), pilot(2, 6), pilot(3, 12)]
    const wrapper = await mountTab()
    await wrapper.findAll('button').find(b => b.text().includes('Seniority'))!.trigger('click')
    expect(bodyRows(wrapper).map(row => row.slice(0, 1))).toEqual(['1', '2', '3'])
  })

  it('announces the date sort direction and reverses the retirement order', async () => {
    mockStore.entries = [pilot(1, 18), pilot(2, 6)]
    const wrapper = await mountTab()

    await wrapper.get('button[aria-label="Sort by Estimated retirement date, currently ascending"]').trigger('click')

    expect(bodyRows(wrapper)[0]).toContain(inMonths(18))
    expect(wrapper.find('button[aria-label="Sort by Estimated retirement date, currently descending"]').exists()).toBe(true)
  })

  it('shows the signed Rank difference for pilots senior to the Anchor Pilot', async () => {
    mockStore.entries = [pilot(1, 6), pilot(2, 7), pilot(3, 600)]
    mockUserStore.employeeNumber = 'E3'
    const wrapper = await mountTab()
    expect(wrapper.text()).toContain('Senior to me only')
    expect(wrapper.text()).toContain('+2')
    expect(wrapper.text()).not.toContain('Set an employee number that appears in this list')
  })

  it('explains an empty result', async () => {
    mockStore.entries = [pilot(1, 600)]
    const wrapper = await mountTab()
    expect(wrapper.text()).toContain('No retirements found')
    expect(wrapper.text()).toContain('No pilots match the current filters within 2 years')
  })

  it('reads out the chosen years and shows later retirements as the slider moves', async () => {
    mockStore.entries = [pilot(1, 6), pilot(2, 30)]
    const wrapper = await mountTab()
    expect(wrapper.text()).toContain('Retiring within')
    expect(wrapper.text()).toContain(`2 years · through ${inMonths(24)}`)
    expect(bodyRows(wrapper)).toHaveLength(1)

    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.text()).toContain(`3 years · through ${inMonths(36)}`)
    expect(bodyRows(wrapper)).toHaveLength(1)
    await vi.waitFor(() => expect(bodyRows(wrapper)[1]).toContain(inMonths(30)))
  })

  it('renders one page of rows and moves to the next page', async () => {
    mockStore.entries = Array.from({ length: 120 }, (_, i) => pilot(i + 1, 1 + (i % 20)))
    const wrapper = await mountTab()
    expect(bodyRows(wrapper)).toHaveLength(50)
    expect(wrapper.text()).toContain('120 results')
    await wrapper.get('button[aria-label="Next Page"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Page 2 of 3'))
    expect(bodyRows(wrapper)).toHaveLength(50)
  })
})
