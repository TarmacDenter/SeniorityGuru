// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock db module
// ---------------------------------------------------------------------------

const mockDb = vi.hoisted(() => ({
  preferences: {
    get: vi.fn(),
    put: vi.fn(),
    clear: vi.fn(),
    toCollection: vi.fn(),
  },
}))

vi.mock('~/utils/db', () => ({ db: mockDb }))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('user store (Dexie preferences)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.preferences.get.mockResolvedValue(undefined)
    mockDb.preferences.put.mockResolvedValue('key')
  })

  describe('loadPreferences', () => {
    it('loads employeeNumber from preferences table', async () => {
      mockDb.preferences.get.mockImplementation(async (key: string) => {
        if (key === 'employeeNumber') return { key: 'employeeNumber', value: '99999' }
        return undefined
      })

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.clearPreferences()

      await store.loadPreferences()

      expect(store.employeeNumber).toBe('99999')
    })

    it('loads retirementAge from preferences table', async () => {
      mockDb.preferences.get.mockImplementation(async (key: string) => {
        if (key === 'retirementAge') return { key: 'retirementAge', value: '60' }
        return undefined
      })

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.clearPreferences()

      await store.loadPreferences()

      expect(store.retirementAge).toBe(60)
    })

    it('defaults employeeNumber to null when not in DB', async () => {
      mockDb.preferences.get.mockResolvedValue(undefined)

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.clearPreferences()

      await store.loadPreferences()

      expect(store.employeeNumber).toBeNull()
    })

    it('defaults retirementAge to 65 when not in DB', async () => {
      mockDb.preferences.get.mockResolvedValue(undefined)

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.clearPreferences()

      await store.loadPreferences()

      expect(store.retirementAge).toBe(65)
    })

    it('sets error and leaves defaults when db.preferences.get throws', async () => {
      mockDb.preferences.get.mockRejectedValue(new Error('DB read failed'))

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.clearPreferences()

      await store.loadPreferences()

      expect(store.error).toBeTruthy()
      expect(store.employeeNumber).toBeNull()
      expect(store.retirementAge).toBe(65)
    })
  })

  describe('savePreference', () => {
    it('calls db.preferences.put with serialized string value', async () => {
      const { useUserStore } = await import('./user')
      const store = useUserStore()

      await store.savePreference('employeeNumber', '12345')

      expect(mockDb.preferences.put).toHaveBeenCalledWith({ key: 'employeeNumber', value: '12345' })
    })

    it('updates employeeNumber ref when key is employeeNumber', async () => {
      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.clearPreferences()

      await store.savePreference('employeeNumber', '54321')

      expect(store.employeeNumber).toBe('54321')
    })

    it('updates retirementAge ref when key is retirementAge', async () => {
      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.clearPreferences()

      await store.savePreference('retirementAge', 62)

      expect(store.retirementAge).toBe(62)
    })
  })

  describe('getPreference', () => {
    it('returns a boolean for newHireEnabled key', async () => {
      mockDb.preferences.get.mockResolvedValue({ key: 'newHireEnabled', value: 'true' })

      const { useUserStore } = await import('./user')
      const store = useUserStore()

      const result = await store.getPreference('newHireEnabled')

      expect(mockDb.preferences.get).toHaveBeenCalledWith('newHireEnabled')
      expect(result).toBe(true)
    })

    it('returns null when key does not exist in DB', async () => {
      mockDb.preferences.get.mockResolvedValue(undefined)

      const { useUserStore } = await import('./user')
      const store = useUserStore()

      const result = await store.getPreference('employeeNumber')

      expect(result).toBeNull()
    })
  })

  describe('clearPreferences', () => {
    it('wipes db.preferences and resets reactive refs', async () => {
      mockDb.preferences.clear.mockResolvedValue(undefined)
      mockDb.preferences.get.mockImplementation(async (key: string) => {
        if (key === 'employeeNumber') return { key: 'employeeNumber', value: '99999' }
        if (key === 'retirementAge') return { key: 'retirementAge', value: '60' }
        return undefined
      })

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.loadPreferences()

      expect(store.employeeNumber).toBe('99999')

      await store.clearPreferences()

      expect(mockDb.preferences.clear).toHaveBeenCalled()
      expect(store.employeeNumber).toBeNull()
      expect(store.retirementAge).toBe(65)
      expect(store.error).toBeNull()
    })

    it('resets employeeNumber to null and retirementAge to 65', async () => {
      mockDb.preferences.clear.mockResolvedValue(undefined)
      mockDb.preferences.get.mockImplementation(async (key: string) => {
        if (key === 'employeeNumber') return { key: 'employeeNumber', value: '99999' }
        if (key === 'retirementAge') return { key: 'retirementAge', value: '60' }
        return undefined
      })

      const { useUserStore } = await import('./user')
      const store = useUserStore()
      await store.loadPreferences()

      expect(store.employeeNumber).toBe('99999')
      expect(store.retirementAge).toBe(60)

      await store.clearPreferences()

      expect(store.employeeNumber).toBeNull()
      expect(store.retirementAge).toBe(65)
      expect(store.error).toBeNull()
    })
  })

  describe('typed preferences (PreferenceMap)', () => {
    it('getPreference returns boolean true for newHireEnabled stored as "true"', async () => {
      mockDb.preferences.get.mockResolvedValue({ key: 'newHireEnabled', value: 'true' })

      const { useUserStore } = await import('./user')
      const store = useUserStore()

      const result = await store.getPreference('newHireEnabled')

      expect(result).toBe(true)
      expect(typeof result).toBe('boolean')
    })

    it('getPreference returns number for retirementAge stored as "62"', async () => {
      mockDb.preferences.get.mockResolvedValue({ key: 'retirementAge', value: '62' })

      const { useUserStore } = await import('./user')
      const store = useUserStore()

      const result = await store.getPreference('retirementAge')

      expect(result).toBe(62)
      expect(typeof result).toBe('number')
    })

    it('getPreference returns NewHireConfig object for growthConfig stored as JSON', async () => {
      const config = { birthDate: '1990-01-01', selectedBase: 'JFK', selectedSeat: 'FO', selectedFleet: '737' }
      mockDb.preferences.get.mockResolvedValue({ key: 'growthConfig', value: JSON.stringify(config) })

      const { useUserStore } = await import('./user')
      const store = useUserStore()

      const result = await store.getPreference('growthConfig')

      expect(result).toEqual(config)
      expect(typeof result).toBe('object')
    })

    it('savePreference serializes NewHireConfig object to JSON string in Dexie', async () => {
      const config = { birthDate: '1990-01-01', selectedBase: 'JFK', selectedSeat: 'FO', selectedFleet: '737' }

      const { useUserStore } = await import('./user')
      const store = useUserStore()

      await store.savePreference('growthConfig', config)

      expect(mockDb.preferences.put).toHaveBeenCalledWith({
        key: 'growthConfig',
        value: JSON.stringify(config),
      })
    })

    it('savePreference serializes number retirementAge to string in Dexie', async () => {
      const { useUserStore } = await import('./user')
      const store = useUserStore()

      await store.savePreference('retirementAge', 62)

      expect(mockDb.preferences.put).toHaveBeenCalledWith({ key: 'retirementAge', value: '62' })
      expect(store.retirementAge).toBe(62)
    })

    it('savePreference serializes boolean demoBannerDismissed to "true" string in Dexie', async () => {
      const { useUserStore } = await import('./user')
      const store = useUserStore()

      await store.savePreference('demoBannerDismissed', true)

      expect(mockDb.preferences.put).toHaveBeenCalledWith({
        key: 'demoBannerDismissed',
        value: 'true',
      })
    })
  })

  describe('interface', () => {
    it('does not expose profile, isAdmin, isModerator, fetchProfile, or clearProfile', async () => {
      const { useUserStore } = await import('./user')
      const store = useUserStore()

      expect((store as any).profile).toBeUndefined()
      expect((store as any).isAdmin).toBeUndefined()
      expect((store as any).isModerator).toBeUndefined()
      expect((store as any).fetchProfile).toBeUndefined()
      expect((store as any).clearProfile).toBeUndefined()
    })
  })
})
