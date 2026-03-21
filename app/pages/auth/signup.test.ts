import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SignupPage from './signup.vue'

describe('signup page', () => {
  it('renders the create account heading', async () => {
    const wrapper = await mountSuspended(SignupPage)
    expect(wrapper.text()).toContain('Create your account')
  })

  it('renders a signup form with email and password fields', async () => {
    const wrapper = await mountSuspended(SignupPage)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.findAll('input[type="password"]').length).toBe(2)
  })

  it('does not render OAuth buttons', async () => {
    const wrapper = await mountSuspended(SignupPage)
    expect(wrapper.text()).not.toContain('Continue with Google')
    expect(wrapper.text()).not.toContain('Continue with Apple')
  })

  it('shows a link to the login page', async () => {
    const wrapper = await mountSuspended(SignupPage)
    const link = wrapper.find('a[href="/auth/login"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Sign in')
  })
})
