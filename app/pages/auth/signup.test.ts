import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SignupPage from './signup.vue'

describe('signup page (invite-only)', () => {
  it('renders the invite-only message', async () => {
    const wrapper = await mountSuspended(SignupPage)
    expect(wrapper.text()).toContain('Invite Only')
    expect(wrapper.text()).toContain('invite-only')
  })

  it('does not render a signup form', async () => {
    const wrapper = await mountSuspended(SignupPage)
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('input[type="email"]').exists()).toBe(false)
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
  })

  it('shows a link to the login page', async () => {
    const wrapper = await mountSuspended(SignupPage)
    const link = wrapper.find('a[href="/auth/login"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Sign in')
  })
})
