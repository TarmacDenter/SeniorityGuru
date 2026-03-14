import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AcceptInvitePage from './accept-invite.vue'

const { mockVerifyOtp, mockRoute, mockNavigateTo } = vi.hoisted(() => ({
  mockVerifyOtp: vi.fn(),
  mockRoute: { value: { query: {} as Record<string, string> } },
  mockNavigateTo: vi.fn(),
}))

mockNuxtImport('useSupabaseClient', () => () => ({
  auth: { verifyOtp: mockVerifyOtp },
}))

mockNuxtImport('useRoute', () => () => mockRoute.value)
mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('accept-invite page', () => {
  beforeEach(() => {
    mockVerifyOtp.mockReset()
    mockNavigateTo.mockReset()
    mockRoute.value = { query: {} }
  })

  it('renders the email and code form', async () => {
    const wrapper = await mountSuspended(AcceptInvitePage)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('6-digit code')
  })

  it('pre-fills email from query param', async () => {
    mockRoute.value = { query: { email: 'pilot@example.com' } }
    const wrapper = await mountSuspended(AcceptInvitePage)
    expect(wrapper.vm.state.email).toBe('pilot@example.com')
  })

  it('calls verifyOtp with email, token, and type=invite on submit', async () => {
    mockVerifyOtp.mockResolvedValue({ error: null })
    const wrapper = await mountSuspended(AcceptInvitePage)

    wrapper.vm.state.email = 'pilot@example.com'
    wrapper.vm.state.token = '123456'
    await wrapper.vm.onSubmit()

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'pilot@example.com',
      token: '123456',
      type: 'invite',
    })
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/update-password')
  })

  it('shows expired error when verifyOtp returns an OTP error', async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: 'otp expired or invalid' } })
    const wrapper = await mountSuspended(AcceptInvitePage)

    wrapper.vm.state.email = 'pilot@example.com'
    wrapper.vm.state.token = '000000'
    await wrapper.vm.onSubmit()

    expect(wrapper.text()).toContain('expired or is invalid')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('shows generic error when verifyOtp returns an unexpected error', async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: 'Something unexpected happened' } })
    const wrapper = await mountSuspended(AcceptInvitePage)

    wrapper.vm.state.email = 'pilot@example.com'
    wrapper.vm.state.token = '000000'
    await wrapper.vm.onSubmit()

    expect(wrapper.text()).toContain('Something unexpected happened')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
