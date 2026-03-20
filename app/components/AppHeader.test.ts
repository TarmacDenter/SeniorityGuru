import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AppHeader from './AppHeader.vue'

const { mockUser } = vi.hoisted(() => {
  const { ref: vueRef } = require('vue')
  return { mockUser: vueRef(null) }
})

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('useSignOut', () => () => ({ signOut: vi.fn() }))

describe('AppHeader', () => {
  beforeEach(() => {
    mockUser.value = null
  })

  it('links logo to / when user is not signed in', async () => {
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.html()).toContain('href="/"')
  })

  it('links logo to /dashboard when user is signed in', async () => {
    mockUser.value = { sub: 'user-123' }
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.html()).toContain('href="/dashboard"')
  })

  it('shows "Sign in" button when user is not signed in', async () => {
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.text()).toContain('Sign in')
    expect(wrapper.text()).not.toContain('Go to Dashboard')
    expect(wrapper.text()).not.toContain('Sign out')
  })

  it('shows "Go to Dashboard" and "Sign out" when user is signed in', async () => {
    mockUser.value = { sub: 'user-123' }
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.text()).toContain('Go to Dashboard')
    expect(wrapper.text()).toContain('Sign out')
    expect(wrapper.text()).not.toContain('Sign in')
  })
})
