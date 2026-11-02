// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { parsePlainDate, Temporal } from '~/utils/temporal'
import { UApp } from '#components'
import { _resetCoreSingletons, useSeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { useScenario } from '~/composables/useScenario'
import { resetMockStores } from '~/test-utils/seniority-mocks'

// Each small view, fed by the real composables over a five-pilot list with E4 as the Anchor Pilot.
const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[], fetchLists: vi.fn(), fetchEntries: vi.fn() }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, loadPreferences: vi.fn(), getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))
vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' }, Line: { template: '<div />' }, Doughnut: { template: '<div />' } }))
vi.mock('~/composables/seniority/modules/useSeniorityCompare', () => ({
  useSeniorityCompare: () => ({ loading: ref(false), error: ref(null), comparison: ref(null) }),
}))

const mockRoute = vi.hoisted(() => ({ path: '/dashboard/current/status', query: {} as Record<string, string> }))
mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('navigateTo', () => vi.fn())

const { makeEntry } = await import('~/test-utils/factories')

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
  useScenario().scopeLabel.value = 'Company-wide'
  useState('dashboardListLoading').value = false
  mockStore.entries = [
    makeEntry({ seniority_number: 1, employee_number: 'E1', name: 'Pilot One', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2030-06-15' }),
    makeEntry({ seniority_number: 2, employee_number: 'E2', name: 'Pilot Two', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2032-06-15' }),
    makeEntry({ seniority_number: 3, employee_number: 'E3', name: 'Pilot Three', base: 'BOS', seat: 'FO', fleet: '320', retire_date: '2034-06-15' }),
    makeEntry({ seniority_number: 4, employee_number: 'E4', name: 'Pilot Four', base: 'BOS', seat: 'FO', fleet: '320', retire_date: '2045-06-15' }),
    makeEntry({ seniority_number: 5, employee_number: 'E5', name: 'Pilot Five', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2046-06-15' }),
  ]
  mockStore.lists = [{ id: 1, title: 'Fleet list', effectiveDate: parsePlainDate('2026-01-15'), createdAt: Temporal.Instant.from('2026-01-15T00:00:00Z') }]
  mockUserStore.employeeNumber = 'E4'
})

async function visit(page: Promise<{ default: object }>) {
  const Page = (await page).default
  const wrapper = await mountSuspended(defineComponent({ render: () => h(UApp, null, () => h(Page)) }))
  await flushPromises()
  return wrapper
}

const views = {
  'Current › Status': () => import('./current/status.vue'),
  'Current › Holdability': () => import('./current/holdability.vue'),
  'Trajectory › Projection': () => import('./trajectory/projection.vue'),
  'Trajectory › Retirements': () => import('./trajectory/retirements.vue'),
  'Demographics': () => import('./demographics.vue'),
  'List › Full list': () => import('./list/full.vue'),
  'List › Upcoming retirements': () => import('./list/retirements.vue'),
  'List › Compare': () => import('./list/compare.vue'),
  'List › Uploads': () => import('./list/uploads.vue'),
}

describe('dashboard small views', () => {
  it.each([
    ['Current › Status', 'Your line on the Seniority List'],
    ['Current › Holdability', 'When can you hold each Qualification?'],
    ['Trajectory › Projection', 'Your Seniority Percentile over time'],
    ['Trajectory › Retirements', 'Retirement Projections'],
    ['Demographics', 'Who holds each Qualification'],
    ['List › Full list', 'Pilot Four'],
    ['List › Upcoming retirements', 'Senior to me only'],
    ['List › Compare', 'Older List'],
    ['List › Uploads', 'Fleet list'],
  ] as const)('%s shows %s', async (view, text) => {
    const wrapper = await visit(views[view]())
    expect(wrapper.text()).toContain(text)
  })

  it('shows Seniority Position by Qual on Holdability only', async () => {
    const homes: string[] = []
    for (const [view, page] of Object.entries(views)) {
      const wrapper = await visit(page())
      if (wrapper.text().includes('Seniority Position by Qual')) homes.push(view)
      wrapper.unmount()
    }
    expect(homes).toEqual(['Current › Holdability'])
  }, 20000)

  it.each(['Trajectory › Projection', 'Trajectory › Retirements'] as const)('%s asks for an Anchor Pilot when there is none', async (view) => {
    mockUserStore.employeeNumber = null
    const wrapper = await visit(views[view]())
    expect(wrapper.text()).toContain('No trajectory yet')
  })
})

describe('list metadata', () => {
  it('lives in List › Uploads, not Current › Status', async () => {
    const uploads = await visit(views['List › Uploads']())
    expect(uploads.text()).toContain('Lists Uploaded')
    expect(uploads.text()).toContain('Recent Lists')
    uploads.unmount()

    const status = await visit(views['Current › Status']())
    expect(status.text()).not.toContain('Lists Uploaded')
    expect(status.text()).not.toContain('Recent Lists')
  })
})
