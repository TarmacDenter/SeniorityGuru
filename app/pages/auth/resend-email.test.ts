import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ResendEmailPage from './resend-email.vue'

const { mockUser, mockNavigateTo, mockResend } = vi.hoisted(() => ({
  mockUser: { value: null as { email?: string; user_metadata?: Record<string, unknown> } | null },
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

  it('navigates to /dashboard when user already has email_verified on mount', async () => {
    // watchEffect fires eagerly — set user before mount so the guard triggers on first run
    mockUser.value = { email: 'pilot@example.com', user_metadata: { email_verified: true } }
    await mountSuspended(ResendEmailPage)
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('calls navigateTo exactly once even on repeated mount ticks (re-entry guard)', async () => {
    mockUser.value = { email: 'pilot@example.com', user_metadata: { email_verified: true } }
    await mountSuspended(ResendEmailPage)
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).toHaveBeenCalledTimes(1)
  })

  it('does not navigate when user is null', async () => {
    const wrapper = await mountSuspended(ResendEmailPage)
    await wrapper.vm.$nextTick()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
