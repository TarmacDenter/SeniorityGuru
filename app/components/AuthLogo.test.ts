import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AuthLogo from './AuthLogo.vue'

const { mockUser } = vi.hoisted(() => {
  const { ref: vueRef } = require('vue')
  return { mockUser: vueRef(null) }
})

mockNuxtImport('useSupabaseUser', () => () => mockUser)

describe('AuthLogo', () => {
  beforeEach(() => {
    mockUser.value = null
  })

  it('links to / when user is not signed in', async () => {
    const wrapper = await mountSuspended(AuthLogo)
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/')
  })

  it('links to /dashboard when user is signed in', async () => {
    mockUser.value = { sub: 'user-123' }
    const wrapper = await mountSuspended(AuthLogo)
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/dashboard')
  })
})
