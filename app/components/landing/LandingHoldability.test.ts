import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import { UApp } from '#components'
import LandingShowcase from './LandingShowcase.vue'
import LandingHoldability from './LandingHoldability.vue'

const mockStore = vi.hoisted(() => ({ entries: [] as unknown[], lists: [] as unknown[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn() } } }))

vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' }, Line: { template: '<div />' }, Doughnut: { template: '<div />' } }))

async function until(cond: () => boolean) {
  for (let i = 0; i < 300 && !cond(); i++) await new Promise(r => setTimeout(r, 10))
}

const Harness = { setup: () => () => h(UApp, null, () => h(LandingShowcase, null, { default: () => h(LandingHoldability) })) }

describe('LandingHoldability', () => {
  it('shows the sample pilot\'s Holdable status by Qualification, Captain first', async () => {
    const wrapper = await mountSuspended(Harness)
    await until(() => wrapper.text().includes('Holdable'))
    const text = wrapper.text()

    expect(text).toContain('Holdability by Qualification')
    expect(text).toContain('Rank today')
    expect(text).toContain('Seniority Percentile')
    expect(text).toMatch(/Holdable (now|from \d{4})/)
    expect(wrapper.find('section[aria-label="Captain"]').exists()).toBe(true)
    expect(text).toContain('Sample pilot from the demo list')
  })

  it('keeps the seat switch and offers no chart to open', async () => {
    const wrapper = await mountSuspended(Harness)
    await until(() => wrapper.text().includes('Holdable'))

    const labels = wrapper.findAll('button').map(button => button.text())
    expect(labels).toContain('Captain')
    expect(labels).toContain('First Officer')
    expect(wrapper.find('table [aria-expanded]').exists()).toBe(false)
  })
})
