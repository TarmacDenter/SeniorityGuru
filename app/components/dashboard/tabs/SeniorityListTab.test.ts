import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'
import SeniorityListTab from './SeniorityListTab.vue'

const stubs = {
  SeniorityListViewer: { template: '<p>full list viewer</p>' },
  DashboardTabsRetirementsTab: { template: '<p>retirements table</p>' },
}

async function mountTab() {
  const Harness = defineComponent({
    setup: () => () => h(UApp, null, () => h(SeniorityListTab, {
      loading: false,
      listOptions: [{ id: 1, label: 'Fleet list (2026-01-15)', isLatest: true }],
      isDemo: false,
      isHistorical: false,
    })),
  })
  return mountSuspended(Harness, { global: { stubs } })
}

describe('SeniorityListTab', () => {
  it('opens on the list with Compare and Upload within reach', async () => {
    const wrapper = await mountTab()
    expect(wrapper.text()).toContain('full list viewer')
    expect(wrapper.text()).not.toContain('retirements table')
    expect(wrapper.find('a[href="/seniority/compare"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/seniority/upload"]').exists()).toBe(true)
  })

  it('switches to the Retirements table and back', async () => {
    const wrapper = await mountTab()
    const button = (label: string) => wrapper.findAll('button').find(b => b.text() === label)!

    await button('Retirements').trigger('mousedown', { button: 0 })
    expect(wrapper.text()).toContain('retirements table')
    expect(wrapper.text()).not.toContain('full list viewer')

    await button('Seniority list').trigger('mousedown', { button: 0 })
    expect(wrapper.text()).toContain('full list viewer')
  })
})
