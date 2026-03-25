import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ParserSelector from './ParserSelector.vue'
import { parsers } from '~/utils/parsers/registry'

describe('ParserSelector', () => {
  it('renders a card for each registered parser', async () => {
    const wrapper = await mountSuspended(ParserSelector, {
      props: { parsers },
    })
    for (const parser of parsers) {
      expect(wrapper.text()).toContain(parser.label)
    }
  })

  it('emits select with parser id when card is clicked', async () => {
    const wrapper = await mountSuspended(ParserSelector, {
      props: { parsers },
    })
    const cards = wrapper.findAllComponents({ name: 'UCard' })
    expect(cards.length).toBeGreaterThanOrEqual(1)
    await cards[0]!.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([parsers[0]!.id])
  })

  it('renders "Don\'t see your airline?" contact link', async () => {
    const wrapper = await mountSuspended(ParserSelector, {
      props: { parsers },
    })
    expect(wrapper.text()).toContain("Don't see your airline?")
    expect(wrapper.html()).toContain('mailto:')
  })

  it('renders Learn More button for each parser', async () => {
    const wrapper = await mountSuspended(ParserSelector, {
      props: { parsers },
    })
    const learnMoreButtons = wrapper.findAll('button').filter(b => b.text().includes('Learn More'))
    expect(learnMoreButtons.length).toBe(parsers.length)
  })
})
