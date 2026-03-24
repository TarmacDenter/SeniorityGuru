import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import MobileBottomBar from './MobileBottomBar.vue'

const mockRoute = vi.hoisted(() => ({ path: '/dashboard', query: {} }))
mockNuxtImport('useRoute', () => () => mockRoute)

beforeEach(() => {
  mockRoute.path = '/dashboard'
})

describe('MobileBottomBar', () => {
  it('renders 5 nav items', async () => {
    const wrapper = await mountSuspended(MobileBottomBar)
    expect(wrapper.findAll('a')).toHaveLength(5)
  })

  it('has sm:hidden on root nav', async () => {
    const wrapper = await mountSuspended(MobileBottomBar)
    expect(wrapper.find('nav').classes()).toContain('sm:hidden')
  })

  it('marks Dashboard active on /dashboard', async () => {
    const wrapper = await mountSuspended(MobileBottomBar)
    expect(wrapper.find('a[href="/dashboard"]').classes()).toContain('text-primary')
    expect(wrapper.find('a[href="/settings"]').classes()).not.toContain('text-primary')
  })

  it('marks Lists active on /seniority/lists', async () => {
    mockRoute.path = '/seniority/lists'
    const wrapper = await mountSuspended(MobileBottomBar)
    expect(wrapper.find('a[href="/seniority/lists"]').classes()).toContain('text-primary')
    expect(wrapper.find('a[href="/dashboard"]').classes()).not.toContain('text-primary')
  })

  it('marks Upload active on /seniority/upload', async () => {
    mockRoute.path = '/seniority/upload'
    const wrapper = await mountSuspended(MobileBottomBar)
    expect(wrapper.find('a[href="/seniority/upload"]').classes()).toContain('text-primary')
  })

  it('marks Compare active on /seniority/compare', async () => {
    mockRoute.path = '/seniority/compare'
    const wrapper = await mountSuspended(MobileBottomBar)
    expect(wrapper.find('a[href="/seniority/compare"]').classes()).toContain('text-primary')
  })

  it('marks Settings active on /settings', async () => {
    mockRoute.path = '/settings'
    const wrapper = await mountSuspended(MobileBottomBar)
    expect(wrapper.find('a[href="/settings"]').classes()).toContain('text-primary')
  })
})
