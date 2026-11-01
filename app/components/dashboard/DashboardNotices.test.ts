import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import DemoBanner from './DemoBanner.vue'
import InstallBanner from './InstallBanner.vue'

const demo = vi.hoisted(() => ({ dismiss: vi.fn().mockResolvedValue(undefined), exit: vi.fn() }))
const pwa = vi.hoisted(() => ({ install: vi.fn(), snooze: vi.fn().mockResolvedValue(undefined), dismiss: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/composables/useDemoBanner', () => ({ useDemoBanner: () => ({ showBanner: ref(true), showBadge: ref(false), ...demo }) }))
vi.mock('~/composables/usePwaInstall', () => ({
  usePwaInstall: () => ({ showBanner: ref(true), isIos: ref(false), showIosModal: ref(false), ...pwa }),
}))

describe('compact notices', () => {
  it('shows the demo notice as one short line that can be dismissed', async () => {
    const wrapper = await mountSuspended(DemoBanner, { props: { compact: true } })
    expect(wrapper.text()).toContain('Demo mode')
    expect(wrapper.text()).not.toContain('fictional airline')
    await wrapper.findAll('button').find(b => b.text() === 'Dismiss')!.trigger('click')
    expect(wrapper.emitted('dismissed')).toHaveLength(1)
  })

  it('shows the install notice as one short line with its choices', async () => {
    const wrapper = await mountSuspended(InstallBanner, { props: { compact: true } })
    expect(wrapper.text()).toContain('Install Seniority Guru')
    expect(wrapper.text()).not.toContain('browsers won')
    await wrapper.findAll('button').find(b => b.text() === 'Not now')!.trigger('click')
    expect(wrapper.emitted('dismissed')).toHaveLength(1)
  })
})
