import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { UApp } from '#components'
import MobileBottomBar from './MobileBottomBar.vue'

const { mockRoute, mockUnseen } = vi.hoisted(() => ({
  mockRoute: { path: '/dashboard/current/status', query: {} as Record<string, string> },
  mockUnseen: { value: false },
}))
mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useChangelog', () => () => ({ hasUnseenChanges: ref(mockUnseen.value) }))

beforeEach(() => {
  mockRoute.path = '/dashboard/current/status'
  mockRoute.query = {}
  mockUnseen.value = false
  document.body.innerHTML = ''
})

// Note: env(safe-area-inset-bottom) is a browser CSS function that happy-dom strips
// from inline styles. Safe-area padding is verified visually / via Playwright E2E.

async function mountBar() {
  return mountSuspended(defineComponent({ render: () => h(UApp, null, () => h(MobileBottomBar)) }))
}

function barItems(wrapper: Awaited<ReturnType<typeof mountBar>>) {
  return wrapper.find('nav').findAll('a, button').map(item => item.text())
}

describe('MobileBottomBar', () => {
  it('shows the four sections and More', async () => {
    const wrapper = await mountBar()
    expect(barItems(wrapper)).toEqual(['Current', 'Trajectory', 'Demographics', 'List', 'More'])
  })

  it('reserves the device safe area below the navigation items', async () => {
    const wrapper = await mountBar()
    expect(wrapper.find('nav').classes()).toContain('pb-[env(safe-area-inset-bottom)]')
  })

  it.each([
    ['/dashboard/current/holdability', 'Current'],
    ['/dashboard/trajectory/projection', 'Trajectory'],
    ['/dashboard/demographics', 'Demographics'],
    ['/dashboard/list/uploads', 'List'],
  ])('on %s marks %s as the current section', async (path, label) => {
    mockRoute.path = path
    const wrapper = await mountBar()
    const current = wrapper.find('nav').findAll('a').filter(link => link.attributes('aria-current') === 'page')
    expect(current.map(link => link.text())).toEqual([label])
  })

  it('opens a sheet with Upload, Compare and Settings from More', async () => {
    const wrapper = await mountBar()
    expect(document.body.textContent).not.toContain('Upload')

    await wrapper.findAll('button').find(button => button.text() === 'More')!.trigger('click')
    await flushPromises()

    const links = [...document.body.querySelectorAll('[role="dialog"] a')].map(link => [link.textContent?.trim(), link.getAttribute('href')])
    expect(links).toEqual([
      ['Upload', '/seniority/upload'],
      ['Compare', '/dashboard/list/compare'],
      ['Settings', '/settings'],
    ])
  })

  it('marks More when What\'s New has something unseen', async () => {
    mockUnseen.value = true
    const wrapper = await mountBar()
    expect(wrapper.find('[aria-label="More, with unseen updates"]').exists()).toBe(true)
  })
})
