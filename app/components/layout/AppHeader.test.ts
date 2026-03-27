import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppHeader from './AppHeader.vue'

describe('AppHeader', () => {
  it('links logo to /dashboard', async () => {
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.html()).toContain('href="/dashboard"')
  })

  it('shows "Go to Dashboard" button', async () => {
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.text()).toContain('Go to Dashboard')
  })
})
