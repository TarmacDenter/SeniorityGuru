import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SetupProfilePage from './setup-profile.vue'

const { mockSupabaseUpdate, mockNavigateTo, mockFetchProfile, mockUser } = vi.hoisted(() => ({
  mockSupabaseUpdate: vi.fn(),
  mockNavigateTo: vi.fn(),
  mockFetchProfile: vi.fn(),
  mockUser: { value: { sub: 'test-user-id' } as Record<string, unknown> | null },
}))

mockNuxtImport('useSupabaseClient', () => () => ({
  auth: { onAuthStateChange: vi.fn() },
  from: () => ({
    update: () => ({
      eq: mockSupabaseUpdate,
    }),
  }),
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useAirlineOptions', () => () => ({
  options: [],
  loading: false,
  load: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    fetchProfile: mockFetchProfile,
  }),
}))

describe('setup-profile page', () => {
  beforeEach(() => {
    mockSupabaseUpdate.mockReset()
    mockNavigateTo.mockReset()
    mockFetchProfile.mockReset()
    mockUser.value = { sub: 'test-user-id' }
  })

  it('calls navigateTo("/dashboard") after successful profile setup', async () => {
    mockSupabaseUpdate.mockResolvedValue({ error: null })
    mockFetchProfile.mockResolvedValue(undefined)
    mockNavigateTo.mockResolvedValue(undefined)

    const wrapper = await mountSuspended(SetupProfilePage)
    wrapper.vm.state.icaoCode = 'DAL'
    await wrapper.vm.onSubmit()

    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('awaits navigateTo before onSubmit resolves', async () => {
    let navResolve!: () => void
    const navPromise = new Promise<void>(resolve => { navResolve = resolve })
    mockSupabaseUpdate.mockResolvedValue({ error: null })
    mockFetchProfile.mockResolvedValue(undefined)
    mockNavigateTo.mockReturnValue(navPromise)

    const submitPromise = (async () => {
      const wrapper = await mountSuspended(SetupProfilePage)
      wrapper.vm.state.icaoCode = 'DAL'
      return wrapper.vm.onSubmit()
    })()

    // navigateTo was called but not yet resolved — submitPromise should still be pending
    await new Promise(resolve => setTimeout(resolve, 10))
    let resolved = false
    submitPromise.then(() => { resolved = true })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(resolved).toBe(false)

    navResolve()
    await submitPromise
    expect(resolved).toBe(true)
  })

  it('does NOT call navigateTo when Supabase returns an error', async () => {
    mockSupabaseUpdate.mockResolvedValue({ error: { message: 'Update failed' } })

    const wrapper = await mountSuspended(SetupProfilePage)
    wrapper.vm.state.icaoCode = 'DAL'
    await wrapper.vm.onSubmit()

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
