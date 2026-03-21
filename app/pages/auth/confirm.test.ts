import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ConfirmPage from './confirm.vue'

const { mockRoute, mockNavigateTo, mockOnAuthStateChange, mockUnsubscribe, mockSetSession, mockVerifyOtp } = vi.hoisted(() => ({
  mockRoute: { value: { query: {} as Record<string, string>, hash: '' } },
  mockNavigateTo: vi.fn().mockResolvedValue(undefined),
  mockOnAuthStateChange: vi.fn(),
  mockUnsubscribe: vi.fn(),
  mockSetSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
  mockVerifyOtp: vi.fn().mockResolvedValue({ error: null }),
}))

mockNuxtImport('useSupabaseClient', () => () => ({
  auth: {
    onAuthStateChange: mockOnAuthStateChange,
    setSession: mockSetSession,
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
    mockOnAuthStateChange.mockReset()
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } })
    mockSetSession.mockReset()
    mockSetSession.mockResolvedValue({ data: {}, error: null })
    mockVerifyOtp.mockReset()
    mockVerifyOtp.mockResolvedValue({ error: null })
  })

  // --- Default OTP form ---

  it('renders OTP form with email and token inputs by default', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="000000"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Confirm your email')
  })

  it('does not render the loading spinner by default', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.find('.animate-spin').exists()).toBe(false)
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

  // --- Hash error display ---

  it('renders error state when hash contains an error', async () => {
    mockRoute.value = { query: {}, hash: '#error=access_denied&error_code=otp_expired&error_description=Token+has+expired' }
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Link expired')
  })

  it('shows "Resend confirmation email" on hash error', async () => {
    mockRoute.value = { query: {}, hash: '#error=access_denied&error_code=otp_expired&error_description=Token+has+expired' }
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Resend confirmation email')
  })

  // --- Recovery passthrough ---

  it('shows spinner and hides OTP form when type=recovery query param is set', async () => {
    mockRoute.value = { query: { type: 'recovery' }, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(false)
  })

  it('shows recovery spinner when PASSWORD_RECOVERY event fires', async () => {
    mockOnAuthStateChange.mockImplementation((cb: (event: string) => void) => {
      cb('PASSWORD_RECOVERY')
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('calls setSession with hash tokens and navigates to update-password', async () => {
    mockRoute.value = {
      query: { type: 'recovery' },
      hash: '#access_token=tok_abc&refresh_token=ref_xyz&expires_in=3600&token_type=bearer',
    }
    await mountSuspended(ConfirmPage)
    await new Promise(r => setTimeout(r, 0))
    expect(mockSetSession).toHaveBeenCalledWith({ access_token: 'tok_abc', refresh_token: 'ref_xyz' })
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/update-password')
  })

  it('does not call setSession when hash contains an error instead of tokens', async () => {
    mockRoute.value = { query: {}, hash: '#error=access_denied&error_code=otp_expired' }
    await mountSuspended(ConfirmPage)
    await new Promise(r => setTimeout(r, 0))
    expect(mockSetSession).not.toHaveBeenCalled()
  })

  it('does not call setSession when hash is empty', async () => {
    mockRoute.value = { query: {}, hash: '' }
    await mountSuspended(ConfirmPage)
    await new Promise(r => setTimeout(r, 0))
    expect(mockSetSession).not.toHaveBeenCalled()
  })

  // --- OTP form submission ---

  it('calls verifyOtp with type signup on form submit', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('input[placeholder="000000"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'pilot@example.com',
      token: '123456',
      type: 'signup',
    })
  })

  it('navigates to /dashboard on successful verifyOtp', async () => {
    mockVerifyOtp.mockResolvedValue({ error: null })
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.find('input[type="email"]').setValue('pilot@example.com')
    await wrapper.find('input[placeholder="000000"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('shows error message and does not navigate when verifyOtp returns an expired OTP error', async () => {
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
})
