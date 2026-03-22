import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ConfirmPage from './confirm.vue'

const { mockRoute, mockNavigateTo, mockVerifyOtp } = vi.hoisted(() => ({
  mockRoute: { value: { query: {} as Record<string, string>, hash: '' } },
  mockNavigateTo: vi.fn().mockResolvedValue(undefined),
  mockVerifyOtp: vi.fn().mockResolvedValue({ error: null }),
}))

mockNuxtImport('useSupabaseClient', () => () => ({
  auth: {
    verifyOtp: mockVerifyOtp,
  },
}))
mockNuxtImport('useRoute', () => () => mockRoute.value)
mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('confirm page', () => {
  beforeEach(() => {
    mockRoute.value = { query: {}, hash: '' }
    mockNavigateTo.mockReset()
    mockNavigateTo.mockResolvedValue(undefined)
    mockVerifyOtp.mockReset()
    mockVerifyOtp.mockResolvedValue({ error: null })
  })

  // --- Default signup confirmation mode ---

  it('renders OTP form with email and token inputs by default', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="000000"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Confirm your email')
  })

  it('email field is enabled when no email query param provided', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    const input = wrapper.find('input[type="email"]').element as HTMLInputElement
    expect(input.disabled).toBe(false)
  })

  it('email field is disabled and pre-filled when email query param is set', async () => {
    mockRoute.value = { query: { email: 'pilot@example.com' }, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)
    const input = wrapper.find('input[type="email"]').element as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it('shows "Resend" link pointing to /auth/resend-email in signup mode', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    const resendLink = wrapper.find('a[href="/auth/resend-email"]')
    expect(resendLink.exists()).toBe(true)
  })

  // --- Recovery mode ---

  it('renders recovery heading when type=recovery query param is set', async () => {
    mockRoute.value = { query: { type: 'recovery' }, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.text()).toContain('Reset your password')
    expect(wrapper.text()).not.toContain('Confirm your email')
  })

  it('shows recovery code label in recovery mode', async () => {
    mockRoute.value = { query: { type: 'recovery' }, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.text()).toContain('Recovery code')
  })

  it('shows "Request a new code" link pointing to /auth/reset-password in recovery mode', async () => {
    mockRoute.value = { query: { type: 'recovery' }, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)
    const resendLink = wrapper.find('a[href="/auth/reset-password"]')
    expect(resendLink.exists()).toBe(true)
  })

  it('does not show a loading spinner', async () => {
    mockRoute.value = { query: { type: 'recovery' }, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.find('.animate-spin').exists()).toBe(false)
  })

  // --- OTP form submission: signup mode ---

  it('calls verifyOtp with type email on form submit', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('input[placeholder="000000"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'pilot@example.com',
      token: '123456',
      type: 'email',
    })
  })

  it('navigates to /dashboard on successful signup verification', async () => {
    mockVerifyOtp.mockResolvedValue({ error: null })
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('input[placeholder="000000"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  // --- OTP form submission: recovery mode ---

  it('calls verifyOtp with type recovery when in recovery mode', async () => {
    mockRoute.value = { query: { type: 'recovery', email: 'pilot@example.com' }, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[placeholder="000000"]').setValue('654321')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'pilot@example.com',
      token: '654321',
      type: 'recovery',
    })
  })

  it('navigates to /auth/update-password on successful recovery verification', async () => {
    mockRoute.value = { query: { type: 'recovery', email: 'pilot@example.com' }, hash: '' }
    mockVerifyOtp.mockResolvedValue({ error: null })
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[placeholder="000000"]').setValue('654321')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/update-password')
  })

  // --- Error handling ---

  it('shows error message when verifyOtp returns an expired OTP error', async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: 'otp has expired', code: 'otp_expired' } })
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('input[placeholder="000000"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('expired or is invalid')
  })

  it('shows error message when verifyOtp returns an invalid token error', async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: 'Token is invalid or has expired' } })
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('input[placeholder="000000"]').setValue('000000')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.text()).toContain('expired or is invalid')
  })

  it('shows generic error for non-OTP errors', async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: 'Database error' } })
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('input[placeholder="000000"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.text()).toContain('Database error')
  })
})
