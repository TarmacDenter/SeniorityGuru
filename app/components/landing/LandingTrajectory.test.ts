import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'
import { _resetCoreSingletons } from '~/composables/seniority/modules/useSeniorityCore'
import LandingShowcase from './LandingShowcase.vue'
import LandingTrajectory from './LandingTrajectory.vue'

vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' }, Line: { template: '<canvas data-testid="line-chart" />' }, Doughnut: { template: '<div />' } }))

async function until(cond: () => boolean) {
  for (let i = 0; i < 300 && !cond(); i++) await new Promise(r => setTimeout(r, 10))
}

const Page = defineComponent({
  setup: () => () => h(UApp, null, () => h(LandingShowcase, null, () => h(LandingTrajectory))),
})

beforeEach(() => _resetCoreSingletons())

describe('LandingTrajectory', () => {
  it('shows the demo pilot\'s Seniority Percentile over time as one retirements-only scenario', async () => {
    const wrapper = await mountSuspended(Page)
    await until(() => wrapper.text().includes('Seniority Percentile over time'))

    expect(wrapper.text()).toContain('Your Seniority Percentile over time')
    expect(wrapper.text()).toContain('Sample pilot from the demo list')
    expect(wrapper.find('[data-testid="line-chart"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Compare')
    expect(wrapper.text()).toContain('Scheduled retirements only')
    expect(wrapper.findAll('h2').filter(h2 => h2.text() === 'Your Seniority Percentile over time')).toHaveLength(1)
  })
})
