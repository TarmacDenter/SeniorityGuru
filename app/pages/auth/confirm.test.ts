import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ConfirmPage from './confirm.vue'

const { mockUser, mockRoute, mockNavigateTo } = vi.hoisted(() => ({
  mockUser: { value: null as { user_metadata?: Record<string, unknown> } | null },
  mockRoute: { value: { query: {} as Record<string, string>, hash: '' } },
  mockNavigateTo: vi.fn().mockResolvedValue(undefined),
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('useRoute', () => () => mockRoute.value)
mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('confirm page', () => {
  beforeEach(() => {
    mockUser.value = null
    mockRoute.value = { query: {}, hash: '' }
    mockNavigateTo.mockReset()
    mockNavigateTo.mockResolvedValue(undefined)
  })

  it('renders the loading spinner when there is no error', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('renders error state when hash contains an error', async () => {
    mockRoute.value = { query: {}, hash: '#error=access_denied&error_code=otp_expired&error_description=Token+has+expired' }
    const wrapper = await mountSuspended(ConfirmPage)
    expect(wrapper.text()).toContain('Confirmation link expired')
  })

  it('navigates to /dashboard when user is set and type is not recovery', async () => {
    // Set user before mount — watchEffect runs eagerly, so it fires on first render
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
    // The redirected flag prevents double-navigation even if watchEffect re-runs
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
})
