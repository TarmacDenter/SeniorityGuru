import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import MobileBottomBar from './MobileBottomBar.vue'

mockNuxtImport('useRoute', () => () => ({ path: '/dashboard', query: {} }))

describe('MobileBottomBar', () => {
  it('renders 5 nav items', async () => {
    const wrapper = await mountSuspended(MobileBottomBar)
    const links = wrapper.findAll('a')
    expect(links).toHaveLength(5)
  })

  it('marks Dashboard active when on /dashboard', async () => {
    const wrapper = await mountSuspended(MobileBottomBar)
    const dashLink = wrapper.find('a[href="/dashboard"]')
    expect(dashLink?.classes()).toContain('text-primary')
  })

  it('has sm:hidden class on root element', async () => {
    const wrapper = await mountSuspended(MobileBottomBar)
    expect(wrapper.find('nav').classes()).toContain('sm:hidden')
  })
})
