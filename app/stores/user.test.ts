import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerEndpoint, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Tables } from '#shared/types/database'

type Profile = Tables<'profiles'>

// Must be hoisted before any import resolution
const mockUser = vi.hoisted(() => ({
  value: null as { sub: string } | null,
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)

const mockProfile: Profile = {
  id: 'test-user-id',
  role: 'user',
  icao_code: 'DAL',
  employee_number: null,
  created_at: '2026-01-01T00:00:00Z',
  mandatory_retirement_age: 65,
}

describe('user store', () => {
  beforeEach(() => {
    mockUser.value = { sub: 'test-user-id' }
  })

  describe('fetchProfile', () => {
    it('updates profile.value with data from /api/profile', async () => {
      registerEndpoint('/api/profile', () => mockProfile)

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      store.profile = null

      await store.fetchProfile()

      expect(store.profile).not.toBeNull()
      expect(store.profile?.icao_code).toBe('DAL')
      expect(store.error).toBeNull()
    })

    it('reflects updated employee_number after save-then-refetch', async () => {
      const updatedProfile = { ...mockProfile, employee_number: '99999' }
      registerEndpoint('/api/profile', () => updatedProfile)

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      store.profile = { ...mockProfile, employee_number: null }

      await store.fetchProfile()

      expect(store.profile?.employee_number).toBe('99999')
    })

    it('does nothing when user has no sub', async () => {
      mockUser.value = null

      registerEndpoint('/api/profile', () => mockProfile)

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      store.profile = null

      await store.fetchProfile()

      expect(store.profile).toBeNull()
    })

    it('sets error and preserves existing profile when server fails', async () => {
      registerEndpoint('/api/profile', () => {
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
      })

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      const existingProfile = { ...mockProfile, employee_number: '12345' }
      store.profile = existingProfile

      await store.fetchProfile()

      // Should preserve the old profile — error doesn't wipe existing data
      expect(store.profile?.employee_number).toBe('12345')
      expect(store.error).toBeTruthy()
    })

    it('stores optimistically set employee_number even when subsequent refetch fails', async () => {
      // Simulate: component sets employee number optimistically, then refetch fails
      registerEndpoint('/api/profile', () => {
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
      })

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      store.profile = { ...mockProfile, employee_number: null }

      // Optimistic update (what the component will do after saving)
      store.profile = { ...mockProfile, employee_number: '99999' }
      // Then refetch fails — optimistic value must survive
      await store.fetchProfile()

      expect(store.profile?.employee_number).toBe('99999')
    })

    it('clears error on successful refetch', async () => {
      // First a failure to set error
      registerEndpoint('/api/profile', () => {
        throw createError({ statusCode: 500, statusMessage: 'fail' })
      })
      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.fetchProfile()
      expect(store.error).toBeTruthy()

      // Then a success
      registerEndpoint('/api/profile', () => mockProfile)
      await store.fetchProfile()

      expect(store.error).toBeNull()
      expect(store.profile).not.toBeNull()
    })
  })
})
