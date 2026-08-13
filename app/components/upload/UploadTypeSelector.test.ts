import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import UploadTypeSelector from './UploadTypeSelector.vue'
import { importPlugins } from '~/utils/import-pipeline/plugins/registry'

describe('UploadTypeSelector', () => {
  it('renders a card for each registered Upload Type', async () => {
    const wrapper = await mountSuspended(UploadTypeSelector, {
      props: { uploadTypes: importPlugins },
    })
    for (const uploadType of importPlugins) {
      expect(wrapper.text()).toContain(uploadType.label)
    }
  })

  it('emits select with Upload Type ID when card is clicked', async () => {
    const wrapper = await mountSuspended(UploadTypeSelector, {
      props: { uploadTypes: importPlugins },
    })
    const cards = wrapper.findAllComponents({ name: 'UCard' })
    expect(cards.length).toBeGreaterThanOrEqual(1)
    await cards[0]!.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([importPlugins[0]!.id])
  })

  it('renders "Don\'t see your airline?" contact link', async () => {
    const wrapper = await mountSuspended(UploadTypeSelector, {
      props: { uploadTypes: importPlugins },
    })
    expect(wrapper.text()).toContain("Don't see your airline?")
    expect(wrapper.html()).toContain('mailto:')
  })

  it('renders Learn More button for each Upload Type', async () => {
    const wrapper = await mountSuspended(UploadTypeSelector, {
      props: { uploadTypes: importPlugins },
    })
    const learnMoreButtons = wrapper.findAll('button').filter(b => b.text().includes('Learn More'))
    expect(learnMoreButtons.length).toBe(importPlugins.length)
  })
})
