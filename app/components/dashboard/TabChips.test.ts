import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DashboardTabChips from './TabChips.vue'

const panels = [
  { label: 'Now', value: 'now', icon: 'i-lucide-crosshair' },
  { label: 'Next', value: 'next', icon: 'i-lucide-trending-up' },
  { label: 'Qualifications', value: 'qualifications', icon: 'i-lucide-layout-list' },
  { label: 'Lists', value: 'lists', icon: 'i-lucide-list-ordered' },
]

describe('DashboardTabChips', () => {
  it('names the four dashboard panels', async () => {
    const wrapper = await mountSuspended(DashboardTabChips, { props: { tabs: panels, modelValue: 'now' } })
    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['Now', 'Next', 'Qualifications', 'Lists'])
  })

  it('exposes only the selected panel as selected', async () => {
    const wrapper = await mountSuspended(DashboardTabChips, { props: { tabs: panels, modelValue: 'qualifications' } })
    const selected = wrapper.findAll('[role="tab"]').filter(tab => tab.attributes('aria-selected') === 'true')
    expect(selected.map(tab => tab.text())).toEqual(['Qualifications'])
  })

  it('emits the panel that was clicked', async () => {
    const wrapper = await mountSuspended(DashboardTabChips, { props: { tabs: panels, modelValue: 'now' } })
    await wrapper.findAll('[role="tab"]').find(tab => tab.text() === 'Next')?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['next'])
  })

  it('moves between panels with the arrow keys', async () => {
    const wrapper = await mountSuspended(DashboardTabChips, { props: { tabs: panels, modelValue: 'now' } })
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
    await tabs[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['next'], ['lists']])
  })
})
