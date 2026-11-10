import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'
import { _resetCoreSingletons } from '~/composables/seniority/modules/useSeniorityCore'
import LandingShowcase from './LandingShowcase.vue'
import LandingHeatmap from './LandingHeatmap.vue'

vi.mock('vue-chartjs', () => ({ Chart: { props: ['ariaLabel'], template: '<div role="img" :aria-label="ariaLabel" />' } }))

async function until(cond: () => boolean) {
  for (let i = 0; i < 300 && !cond(); i++) await new Promise(r => setTimeout(r, 10))
}

const Page = defineComponent({
  setup: () => () => h(UApp, null, () => h(LandingShowcase, null, () => h(LandingHeatmap))),
})

beforeEach(() => _resetCoreSingletons())

describe('LandingHeatmap', () => {
  it('shows the demo list\'s retirements by Qualification with grouping and a time horizon', async () => {
    const wrapper = await mountSuspended(Page)
    await until(() => wrapper.text().includes('Retirement heatmap'))

    const text = wrapper.text()
    expect(text).toContain('Retirement heatmap')
    expect(text).toContain('Group by')
    expect(wrapper.findAll('[aria-label="Group rows by"] button').map(button => button.text())).toEqual(['Base', 'Seat', 'Fleet'])
    expect(text).toMatch(/Next \d+ years/)
    expect(text).toContain('Demo list')
  })
})
