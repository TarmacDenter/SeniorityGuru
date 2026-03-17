import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import UpdatePasswordPage from './update-password.vue'

const { mockNavigateTo, mockGetSession, mockUpdateUser, mockToastAdd } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn().mockResolvedValue(undefined),
  mockGetSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  mockUpdateUser: vi.fn().mockResolvedValue({ error: null }),
  mockToastAdd: vi.fn(),
}))

mockNuxtImport('useSupabaseClient', () => () => ({
  auth: {
    getSession: mockGetSession,
    updateUser: mockUpdateUser,
    onAuthStateChange: vi.fn(),
  },
}))
mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }))

describe('update-password page', () => {
  beforeEach(() => {
    mockNavigateTo.mockReset()
    mockNavigateTo.mockResolvedValue(undefined)
    mockGetSession.mockReset()
    mockUpdateUser.mockReset()
    mockUpdateUser.mockResolvedValue({ error: null })
    mockToastAdd.mockReset()
  })

  it('renders the password update form', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null })
    const wrapper = await mountSuspended(UpdatePasswordPage)
    expect(wrapper.text()).toContain('Set new password')
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('does NOT redirect when an active session exists despite CSR hydration delay', async () => {
    // Simulates a CSR route where useSupabaseUser() hasn't populated yet,
    // but getSession returns a valid recovery session — user must NOT be bounced.
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null })

    const wrapper = await mountSuspended(UpdatePasswordPage)
    await wrapper.vm.$nextTick()

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('redirects to /auth/reset-password when getSession returns null session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    await mountSuspended(UpdatePasswordPage)
    await new Promise((r) => setTimeout(r, 0))

    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/reset-password')
  })

  it('does not redirect when session is present (regardless of user ref state)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'abc' } } }, error: null })

    await mountSuspended(UpdatePasswordPage)
    await new Promise((r) => setTimeout(r, 0))

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('calls updateUser and navigates to /dashboard on successful submit', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null })
    mockUpdateUser.mockResolvedValue({ error: null })

    const wrapper = await mountSuspended(UpdatePasswordPage)
    wrapper.vm.state.password = 'newpassword123'
    wrapper.vm.state.confirmPassword = 'newpassword123'
    await wrapper.vm.onSubmit()

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('shows error toast and does not navigate on submit failure', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null })
    mockUpdateUser.mockResolvedValue({ error: { message: 'Password too weak' } })

    const wrapper = await mountSuspended(UpdatePasswordPage)
    wrapper.vm.state.password = 'weak'
    wrapper.vm.state.confirmPassword = 'weak'
    await wrapper.vm.onSubmit()

    expect(mockToastAdd).toHaveBeenCalledWith({ title: 'Password too weak', color: 'error' })
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
