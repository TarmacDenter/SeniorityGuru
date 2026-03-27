import { describe, it, expect } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useRuntimeConfig', () => () => ({
  app: { baseURL: '/' },
  public: {
    bmcUrl: 'https://buymeacoffee.com/testuser',
    feedbackEmail: 'feedback@example.com',
  },
}))

describe('SupportModal', () => {
  it('renders a trigger button', async () => {
    const Comp = await import('./SupportModal.vue')
    const wrapper = await mountSuspended(Comp.default)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('exposes the configured BMC URL and mailto href', async () => {
    const Comp = await import('./SupportModal.vue')
    const wrapper = await mountSuspended(Comp.default)
    const vm = wrapper.vm as unknown as { bmcUrl: string; mailtoHref: string }
    expect(vm.bmcUrl).toBe('https://buymeacoffee.com/testuser')
    expect(vm.mailtoHref).toContain('mailto:feedback@example.com')
  })
})
