import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ResendEmailPage from './resend-email.vue'

const { mockUser, mockNavigateTo, mockResend } = vi.hoisted(() => ({
  mockUser: ref<{ email?: string; user_metadata?: Record<string, unknown> } | null>(null),
  mockNavigateTo: vi.fn().mockResolvedValue(undefined),
  mockResend: vi.fn().mockResolvedValue({ error: null }),
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('useSupabaseClient', () => () => ({
  auth: { resend: mockResend },
}))
mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('resend-email page', () => {
  beforeEach(() => {
    mockUser.value = null
    mockNavigateTo.mockReset()
    mockNavigateTo.mockResolvedValue(undefined)
    mockResend.mockReset()
    mockResend.mockResolvedValue({ error: null })
  })

  it('renders the resend email form', async () => {
    const wrapper = await mountSuspended(ResendEmailPage)
    expect(wrapper.text()).toContain('Confirm your email')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('does not navigate when user has no email_verified metadata', async () => {
    mockUser.value = { email: 'pilot@example.com', user_metadata: { email_verified: false } }
    const wrapper = await mountSuspended(ResendEmailPage)
    await wrapper.vm.$nextTick()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('navigates to /dashboard when email_verified becomes true', async () => {
    const wrapper = await mountSuspended(ResendEmailPage)

    mockUser.value = { email: 'pilot@example.com', user_metadata: { email_verified: true } }
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('calls navigateTo exactly once even when email_verified user ref updates multiple times', async () => {
    const wrapper = await mountSuspended(ResendEmailPage)

    // Simulate multiple rapid updates
    mockUser.value = { email: 'pilot@example.com', user_metadata: { email_verified: true } }
    await wrapper.vm.$nextTick()
    mockUser.value = { email: 'pilot@example.com', user_metadata: { email_verified: true, another_update: true } }
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockNavigateTo).toHaveBeenCalledTimes(1)
  })

  it('does not navigate when user is null', async () => {
    const wrapper = await mountSuspended(ResendEmailPage)
    await wrapper.vm.$nextTick()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
