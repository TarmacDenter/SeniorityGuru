import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'
import { _resetCoreSingletons } from '~/composables/seniority/modules/useSeniorityCore'
import LandingShowcase from './LandingShowcase.vue'
import LandingStanding from './LandingStanding.vue'

async function until(cond: () => boolean) {
  for (let i = 0; i < 300 && !cond(); i++) await new Promise(r => setTimeout(r, 10))
}

function page(onOpenDemo: () => void) {
  return defineComponent({
    setup: () => () => h(UApp, null, () => h(LandingShowcase, null, () => h(LandingStanding, { onOpenDemo }))),
  })
}

beforeEach(() => _resetCoreSingletons())

describe('LandingStanding', () => {
  it('shows the demo pilot\'s line on the list and the Standing figures', async () => {
    const wrapper = await mountSuspended(page(() => {}))
    await until(() => wrapper.text().includes('Your standing'))

    expect(wrapper.text()).toContain('Your line on the Seniority List')
    expect(wrapper.text()).toContain('Rank today')
    expect(wrapper.text()).toContain('Seniority Percentile')
    expect(wrapper.text()).toContain('Sample pilot from the demo list')
    expect(wrapper.text()).toContain('Not on the list yet? New Hire Mode estimates your starting position.')
    expect(wrapper.findAll('tbody tr').filter(row => row.text().includes('(Your line)'))).toHaveLength(1)
    expect(wrapper.find('a[href*="/dashboard"]').exists()).toBe(false)
  })

  it('emits open-demo from a figure note instead of linking into the dashboard', async () => {
    let opened = 0
    const wrapper = await mountSuspended(page(() => { opened++ }))
    await until(() => wrapper.text().includes('Your standing'))

    const note = wrapper.find('[data-testid="standing-figures"] button')
    expect(note.exists()).toBe(true)
    await note.trigger('click')
    expect(opened).toBe(1)
  })
})
