import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ParserSelector from './ParserSelector.vue'
import { importPlugins } from '~/utils/import-pipeline/plugins/registry'

describe('ParserSelector', () => {
  it('renders a card for each registered parser', async () => {
    const wrapper = await mountSuspended(ParserSelector, {
      props: { parsers: importPlugins },
    })
    for (const parser of importPlugins) {
      expect(wrapper.text()).toContain(parser.label)
    }
  })

  it('emits select with parser id when card is clicked', async () => {
    const wrapper = await mountSuspended(ParserSelector, {
      props: { parsers: importPlugins },
    })
    const cards = wrapper.findAllComponents({ name: 'UCard' })
    expect(cards.length).toBeGreaterThanOrEqual(1)
    await cards[0]!.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([importPlugins[0]!.id])
  })

  it('renders "Don\'t see your airline?" contact link', async () => {
    const wrapper = await mountSuspended(ParserSelector, {
      props: { parsers: importPlugins },
    })
    expect(wrapper.text()).toContain("Don't see your airline?")
    expect(wrapper.html()).toContain('mailto:')
  })

  it('renders Learn More button for each parser', async () => {
    const wrapper = await mountSuspended(ParserSelector, {
      props: { parsers: importPlugins },
    })
    const learnMoreButtons = wrapper.findAll('button').filter(b => b.text().includes('Learn More'))
    expect(learnMoreButtons.length).toBe(importPlugins.length)
  })
})
