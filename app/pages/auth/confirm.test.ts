import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ConfirmPage from './confirm.vue'

const { mockUser, mockRoute, mockNavigateTo, mockOnAuthStateChange, mockUnsubscribe, mockSetSession } = vi.hoisted(() => ({
  mockUser: { value: null as { user_metadata?: Record<string, unknown> } | null },
  mockRoute: { value: { query: {} as Record<string, string>, hash: '' } },
  mockNavigateTo: vi.fn().mockResolvedValue(undefined),
  mockOnAuthStateChange: vi.fn(),
  mockUnsubscribe: vi.fn(),
  mockSetSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('useSupabaseClient', () => () => ({
  auth: {
    onAuthStateChange: mockOnAuthStateChange,
    setSession: mockSetSession,
  },
}))
mockNuxtImport('useRoute', () => () => mockRoute.value)
mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('confirm page', () => {
  beforeEach(() => {
    mockUser.value = null
    mockRoute.value = { query: {}, hash: '' }
    mockNavigateTo.mockReset()
    mockNavigateTo.mockResolvedValue(undefined)
    mockOnAuthStateChange.mockReset()
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } })
    mockSetSession.mockReset()
    mockSetSession.mockResolvedValue({ data: {}, error: null })
  })

  it('renders the loading spinner when there is no error', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('does not render error state on initial render (SSR safety — hash unavailable server-side)', async () => {
    // Even if errorCode would eventually be set by onMounted, the initial render must show spinner
    mockRoute.value = { query: {}, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Confirmation link expired')
  })

  it('renders error state when hash contains an error', async () => {
    mockRoute.value = { query: {}, hash: '#error=access_denied&error_code=otp_expired&error_description=Token+has+expired' }
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Confirmation link expired')
  })

  it('shows "Request a new reset link" button linking to /auth/reset-password on recovery error', async () => {
    mockRoute.value = { query: { type: 'recovery' }, hash: '#error=access_denied&error_code=otp_expired&error_description=Token+has+expired' }
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Request a new reset link')
    expect(wrapper.text()).not.toContain('Resend confirmation email')
  })

  it('shows "Resend confirmation email" button linking to /auth/resend-email on non-recovery error', async () => {
    mockRoute.value = { query: {}, hash: '#error=access_denied&error_code=otp_expired&error_description=Token+has+expired' }
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Resend confirmation email')
    expect(wrapper.text()).not.toContain('Request a new reset link')
  })

  it('calls setSession with hash tokens when access_token is in the hash', async () => {
    mockRoute.value = {
      query: { type: 'recovery' },
      hash: '#access_token=tok_abc&refresh_token=ref_xyz&expires_in=3600&token_type=bearer',
    }
    await mountSuspended(ConfirmPage)
    await new Promise(r => setTimeout(r, 0))
    expect(mockSetSession).toHaveBeenCalledWith({ access_token: 'tok_abc', refresh_token: 'ref_xyz' })
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

  it('navigates to /dashboard when user is set and type is not recovery', async () => {
    mockUser.value = { user_metadata: {} }
    await mountSuspended(ConfirmPage)
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('navigates to /auth/update-password when type=recovery', async () => {
    mockRoute.value = { query: { type: 'recovery' }, hash: '' }
    mockUser.value = { user_metadata: {} }
    await mountSuspended(ConfirmPage)
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/update-password')
  })

  it('calls navigateTo exactly once even when user is truthy from the start (re-entry guard)', async () => {
    mockUser.value = { user_metadata: {} }
    await mountSuspended(ConfirmPage)
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigateTo).toHaveBeenCalledTimes(1)
  })

  it('does not navigate when user is null', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.vm.$nextTick()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('navigates to /auth/update-password when PASSWORD_RECOVERY event fires', async () => {
    mockOnAuthStateChange.mockImplementation((cb: (event: string) => void) => {
      cb('PASSWORD_RECOVERY')
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    mockUser.value = { user_metadata: {} }

    await mountSuspended(ConfirmPage)
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/update-password')
  })
})
