import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'

const state = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return { compact: vRef(true), short: vRef(true) }
})

vi.mock('@vueuse/core', async importOriginal => ({
  ...await importOriginal<typeof import('@vueuse/core')>(),
  // The compact query and the short query are asked for in turn by the host and the sheet.
  useMediaQuery: (query: string) => (query.includes('max-width') ? state.compact : state.short),
}))

async function mountShell() {
  const { provideDashboardControls } = await import('~/composables/useDashboardControls')
  const Controls = (await import('./Controls.vue')).default
  const Sheet = (await import('./ControlsSheet.vue')).default
  const Shell = defineComponent({
    setup() {
      provideDashboardControls()
      return () => h(UApp, null, () => [
        h(Sheet),
        h(Controls, null, { default: ({ sheet }: { sheet: boolean }) => h('p', { 'data-testid': 'view-controls' }, sheet ? 'in sheet' : 'inline') }),
      ])
    },
  })
  return mountSuspended(Shell)
}

describe('Controls sheet', () => {
  beforeEach(() => {
    state.compact.value = true
    state.short.value = true
  })

  it('shows the controls inline on a screen that is neither narrow nor short', async () => {
    state.compact.value = false
    const wrapper = await mountShell()
    expect(wrapper.get('[data-testid="view-controls"]').text()).toBe('inline')
    expect(wrapper.findAll('button').some(b => b.text() === 'Controls')).toBe(false)
  })

  it('moves the controls behind a Controls button on a compact screen', async () => {
    const wrapper = await mountShell()
    expect(wrapper.find('[data-testid="view-controls"]').exists()).toBe(false)
    const button = wrapper.findAll('button').find(b => b.text() === 'Controls')
    expect(button, 'the Controls button is in the header').toBeDefined()

    await button!.trigger('click')

    await vi.waitFor(() => expect(document.body.querySelector('[data-testid="view-controls"]')?.textContent).toBe('in sheet'))
  })

  it('opens a bottom drawer in portrait', async () => {
    state.short.value = false
    const wrapper = await mountShell()
    await wrapper.findAll('button').find(b => b.text() === 'Controls')!.trigger('click')
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())
    expect(document.body.querySelector('[data-testid="view-controls"]')?.textContent).toBe('in sheet')
  })
})
