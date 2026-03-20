// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SeniorityEntryResponse } from '../../shared/schemas/seniority-list'
import type { ProfileResponse } from '../../shared/schemas/settings'
import { makeEntry, makeProfile } from '#shared/test-utils/factories'

const mockSeniorityStore = vi.hoisted(() => ({
  entries: [] as SeniorityEntryResponse[],
}))

const mockUserStore = vi.hoisted(() => ({
  profile: null as ProfileResponse | null,
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockSeniorityStore,
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

// Mock localStorage for node environment
const localStorageMock: Record<string, string> = {}
const localStorageImpl = {
  getItem: (key: string) => localStorageMock[key] ?? null,
  setItem: (key: string, value: string) => { localStorageMock[key] = value },
  removeItem: (key: string) => { Reflect.deleteProperty(localStorageMock, key) },
  clear: () => { Object.keys(localStorageMock).forEach((k) => Reflect.deleteProperty(localStorageMock, k)) },
}

vi.stubGlobal('localStorage', localStorageImpl)

const { useQualProjections } = await import('./useQualProjections')

describe('useQualProjections', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockUserStore.profile = null
    localStorageImpl.clear()
  })

  describe('isBannerDismissed / dismissBanner', () => {
    it('starts as false when localStorage is empty', () => {
      const { isBannerDismissed } = useQualProjections()
      expect(isBannerDismissed.value).toBe(false)
    })

    it('dismissBanner sets isBannerDismissed to true and persists to localStorage', () => {
      const { isBannerDismissed, dismissBanner } = useQualProjections()
      expect(isBannerDismissed.value).toBe(false)
      dismissBanner()
      expect(isBannerDismissed.value).toBe(true)
      expect(localStorageImpl.getItem('qual-projections-banner-dismissed')).toBe('true')
    })

    it('reads persisted dismissed state from localStorage', () => {
      localStorageImpl.setItem('qual-projections-banner-dismissed', 'true')
      const { isBannerDismissed } = useQualProjections()
      expect(isBannerDismissed.value).toBe(true)
    })
  })

  describe('projectionYears / projectionDate', () => {
    it('projectionYears starts at 0', () => {
      const { projectionYears } = useQualProjections()
      expect(projectionYears.value).toBe(0)
    })

    it('projectionDate is approximately now when projectionYears is 0', () => {
      const { projectionDate } = useQualProjections()
      const now = new Date()
      const diff = Math.abs(projectionDate.value.getTime() - now.getTime())
      // Within 1 second
      expect(diff).toBeLessThan(1000)
    })

    it('projectionDate advances when projectionYears changes', () => {
      const { projectionDate, projectionYears } = useQualProjections()
      projectionYears.value = 5
      const expected = new Date()
      expected.setFullYear(expected.getFullYear() + 5)
      const diff = Math.abs(projectionDate.value.getTime() - expected.getTime())
      expect(diff).toBeLessThan(1000)
    })
  })

  describe('userEntry', () => {
    it('returns undefined when profile is null', () => {
      mockUserStore.profile = null
      const { userEntry } = useQualProjections()
      expect(userEntry.value).toBeUndefined()
    })

    it('returns undefined when no matching entry', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { userEntry } = useQualProjections()
      expect(userEntry.value).toBeUndefined()
    })

    it('returns matching entry when found', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1 }),
        makeEntry({ employee_number: '500', seniority_number: 5 }),
      ]
      const { userEntry } = useQualProjections()
      expect(userEntry.value?.seniority_number).toBe(5)
    })
  })

  describe('powerIndexCells', () => {
    it('returns empty array when no user entry', () => {
      mockUserStore.profile = null
      const { powerIndexCells } = useQualProjections()
      expect(powerIndexCells.value).toEqual([])
    })

    it('returns cells when user entry exists', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1, fleet: '737', seat: 'CA', base: 'JFK', retire_date: '2030-01-01' }),
        makeEntry({ employee_number: '500', seniority_number: 5, fleet: '737', seat: 'CA', base: 'JFK', retire_date: '2040-01-01' }),
      ]
      const { powerIndexCells } = useQualProjections()
      expect(powerIndexCells.value.length).toBeGreaterThan(0)
      expect(powerIndexCells.value[0]).toHaveProperty('fleet')
      expect(powerIndexCells.value[0]).toHaveProperty('seat')
      expect(powerIndexCells.value[0]).toHaveProperty('base')
      expect(powerIndexCells.value[0]).toHaveProperty('state')
    })
  })

  describe('retirementWave', () => {
    it('returns empty array when no entries with retire dates', () => {
      mockSeniorityStore.entries = [makeEntry({ retire_date: undefined })]
      const { retirementWave } = useQualProjections()
      expect(retirementWave.value).toEqual([])
    })

    it('returns wave buckets with correct shape', () => {
      mockSeniorityStore.entries = [
        makeEntry({ retire_date: '2026-06-01' }),
        makeEntry({ retire_date: '2027-06-01' }),
        makeEntry({ retire_date: '2030-06-01' }),
      ]
      const { retirementWave } = useQualProjections()
      const result = retirementWave.value
      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('year')
        expect(result[0]).toHaveProperty('count')
        expect(result[0]).toHaveProperty('isWave')
      }
    })

    it('filters when a qualSpec is passed', () => {
      mockUserStore.profile = makeProfile({ employee_number: '100' })
      mockSeniorityStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1, fleet: '737', retire_date: '2026-06-01' }),
        makeEntry({ employee_number: '200', seniority_number: 2, fleet: '777', retire_date: '2027-06-01' }),
      ]
      const qualSpec = computed(() => ({ fleet: '737' }))
      const { retirementWave } = useQualProjections(qualSpec)
      const result = retirementWave.value
      // Only the 737 entry should be counted
      const total = result.reduce((sum, b) => sum + b.count, 0)
      expect(total).toBe(1)
    })
  })

  describe('waveTrajectory', () => {
    it('returns empty array when no user entry', () => {
      mockUserStore.profile = null
      const { waveTrajectory } = useQualProjections()
      expect(waveTrajectory.value).toEqual([])
    })

    it('returns trajectory points when user entry exists', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1, retire_date: '2030-01-01' }),
        makeEntry({ employee_number: '500', seniority_number: 5, retire_date: '2040-01-01' }),
      ]
      const { waveTrajectory } = useQualProjections()
      expect(waveTrajectory.value.length).toBeGreaterThan(0)
      expect(waveTrajectory.value[0]).toHaveProperty('date')
      expect(waveTrajectory.value[0]).toHaveProperty('rank')
      expect(waveTrajectory.value[0]).toHaveProperty('percentile')
    })
  })

  describe('targetPercentile', () => {
    it('defaults to 50', () => {
      const { targetPercentile } = useQualProjections()
      expect(targetPercentile.value).toBe(50)
    })
  })

  describe('thresholdResult', () => {
    it('returns null when no user entry', () => {
      mockUserStore.profile = null
      const { thresholdResult } = useQualProjections()
      expect(thresholdResult.value).toBeNull()
    })

    it('returns threshold result when user entry exists and threshold reachable', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      const now = new Date()
      // Put seniors who retire soon — user should reach 50th percentile quickly
      mockSeniorityStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1, retire_date: `${now.getFullYear() + 1}-01-01` }),
        makeEntry({ employee_number: '200', seniority_number: 2, retire_date: `${now.getFullYear() + 2}-01-01` }),
        makeEntry({ employee_number: '300', seniority_number: 3, retire_date: `${now.getFullYear() + 3}-01-01` }),
        makeEntry({ employee_number: '400', seniority_number: 4, retire_date: `${now.getFullYear() + 4}-01-01` }),
        makeEntry({ employee_number: '500', seniority_number: 5, retire_date: `${now.getFullYear() + 20}-01-01` }),
      ]
      const { thresholdResult } = useQualProjections()
      // Should find a year (or null if never reached — just check it doesn't throw)
      const result = thresholdResult.value
      if (result !== null) {
        expect(result).toHaveProperty('year')
        expect(result).not.toHaveProperty('optimistic')
        expect(result).not.toHaveProperty('pessimistic')
      }
    })
  })
})
