import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LandingShowcase from './LandingShowcase.vue'

async function until(cond: () => boolean) {
  for (let i = 0; i < 200 && !cond(); i++) await new Promise(r => setTimeout(r, 10))
}

describe('LandingShowcase', () => {
  it('shows placeholders, then renders the slot once the demo lists are ready', async () => {
    const wrapper = await mountSuspended(LandingShowcase, {
      slots: { default: (props: { diffRows: unknown[] }) => `rows:${props.diffRows.length}` },
    })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await until(() => wrapper.text().startsWith('rows:'))
    expect(wrapper.text()).toMatch(/^rows:[1-9]\d*$/)
  })
})
