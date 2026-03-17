import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ConfirmPage from './confirm.vue'

const { mockUser, mockRoute, mockNavigateTo } = vi.hoisted(() => ({
  mockUser: ref<{ user_metadata?: Record<string, unknown> } | null>(null),
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
    mockRoute.value = { query: {}, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)

    mockUser.value = { user_metadata: {} }
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('navigates to /auth/update-password when type=recovery', async () => {
    mockRoute.value = { query: { type: 'recovery' }, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)

    mockUser.value = { user_metadata: {} }
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/update-password')
  })

  it('calls navigateTo exactly once even when user ref updates multiple times', async () => {
    mockRoute.value = { query: {}, hash: '' }
    const wrapper = await mountSuspended(ConfirmPage)

    // Simulate rapid auth state updates (PKCE exchange firing multiple times)
    mockUser.value = { user_metadata: {} }
    await wrapper.vm.$nextTick()
    mockUser.value = { user_metadata: { email_verified: true } }
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockNavigateTo).toHaveBeenCalledTimes(1)
  })

  it('does not navigate when user is null', async () => {
    const wrapper = await mountSuspended(ConfirmPage)
    await wrapper.vm.$nextTick()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
