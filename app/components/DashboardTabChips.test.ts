import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DashboardTabChips from './DashboardTabChips.vue'

const tabs = [
  { label: 'My Status', value: 'status', icon: 'i-lucide-user' },
  { label: 'Demographics', value: 'demographics', icon: 'i-lucide-users' },
  { label: 'Trajectory', value: 'trajectory', icon: 'i-lucide-trending-up' },
]

describe('DashboardTabChips', () => {
  it('renders all provided tabs', async () => {
    const wrapper = await mountSuspended(DashboardTabChips, {
      props: { tabs, modelValue: 'status' },
    })
    expect(wrapper.text()).toContain('My Status')
    expect(wrapper.text()).toContain('Demographics')
    expect(wrapper.text()).toContain('Trajectory')
  })

  it('applies active class to the modelValue tab', async () => {
    const wrapper = await mountSuspended(DashboardTabChips, {
      props: { tabs, modelValue: 'demographics' },
    })
    const buttons = wrapper.findAll('button')
    const demographicsBtn = buttons.find(b => b.text().includes('Demographics'))
    expect(demographicsBtn?.classes()).toContain('text-primary')
  })

  it('emits update:modelValue when a tab is clicked', async () => {
    const wrapper = await mountSuspended(DashboardTabChips, {
      props: { tabs, modelValue: 'status' },
    })
    const buttons = wrapper.findAll('button')
    const trajectoryBtn = buttons.find(b => b.text().includes('Trajectory'))
    await trajectoryBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['trajectory'])
  })
})
