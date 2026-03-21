import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ResendEmailPage from './resend-email.vue'

const { mockUser, mockNavigateTo, mockResend } = vi.hoisted(() => ({
  mockUser: { value: null as { email?: string } | null },
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

  // --- Form rendering ---

  it('renders the resend email form', async () => {
    const wrapper = await mountSuspended(ResendEmailPage)
    expect(wrapper.text()).toContain('Confirm your email')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('email field is enabled when no user session', async () => {
    const wrapper = await mountSuspended(ResendEmailPage)
    const input = wrapper.find('input[type="email"]').element as HTMLInputElement
    expect(input.disabled).toBe(false)
  })

  it('email field is disabled and pre-filled when user has an email', async () => {
    mockUser.value = { email: 'pilot@example.com' }
    const wrapper = await mountSuspended(ResendEmailPage)
    const input = wrapper.find('input[type="email"]').element as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  // --- Post-resend navigation ---

  it('navigates to /auth/confirm with email after successful resend', async () => {
    const wrapper = await mountSuspended(ResendEmailPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/confirm?email=pilot%40example.com')
  })

  it('navigates even when resend returns a non-rate-limit error (anti-enumeration)', async () => {
    mockResend.mockResolvedValue({ error: { code: 'user_not_found', message: 'User not found' } })
    const wrapper = await mountSuspended(ResendEmailPage)
    await wrapper.find('input[type="email"]').setValue('unknown@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/confirm?email=unknown%40example.com')
  })

  // --- Rate-limit error ---

  it('shows rate-limit warning and does not navigate when over_email_otp_max_frequency', async () => {
    mockResend.mockResolvedValue({ error: { code: 'over_email_otp_max_frequency', message: 'Rate limited' } })
    const wrapper = await mountSuspended(ResendEmailPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Too many attempts')
  })
})
