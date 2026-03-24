// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityCore } from './useSeniorityCore'
import { useQualAnalytics } from './useQualAnalytics'

const mockStore = vi.hoisted(() => ({ entries: [] as any[], lists: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65 }))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))
vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))
vi.mock('~/utils/db', () => ({
  db: {
    preferences: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue('key'),
    },
  },
}))

const localStorageMock: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => localStorageMock[key] ?? null,
  setItem: (key: string, value: string) => { localStorageMock[key] = value },
  removeItem: (key: string) => { Reflect.deleteProperty(localStorageMock, key) },
  clear: () => { Object.keys(localStorageMock).forEach(k => Reflect.deleteProperty(localStorageMock, k)) },
})

const { makeEntry } = await import('~/test-utils/factories')

beforeEach(() => {
  mockStore.entries = []
  mockStore.lists = []
  mockUserStore.employeeNumber = null
  mockUserStore.retirementAge = 65
  const { newHire } = useSeniorityCore()
  newHire.reset()
  Object.keys(localStorageMock).forEach(k => Reflect.deleteProperty(localStorageMock, k))
})

describe('useQualAnalytics', () => {
  describe('filter state defaults', () => {
    it('returns null for all filter selections initially', () => {
      const { selectedFleet, selectedSeat, selectedBase } = useQualAnalytics()
      expect(selectedFleet.value).toBeNull()
      expect(selectedSeat.value).toBeNull()
      expect(selectedBase.value).toBeNull()
    })
  })

  describe('available filter options', () => {
    it('returns sorted unique fleets from snapshot', () => {
      mockStore.entries = [
        makeEntry({ fleet: '777' }),
        makeEntry({ fleet: '737' }),
        makeEntry({ fleet: '737' }),
      ]
      const { availableFleets } = useQualAnalytics()
      expect(availableFleets.value).toEqual(['737', '777'])
    })

    it('returns sorted unique seats from snapshot', () => {
      mockStore.entries = [
        makeEntry({ seat: 'FO' }),
        makeEntry({ seat: 'CA' }),
        makeEntry({ seat: 'CA' }),
      ]
      const { availableSeats } = useQualAnalytics()
      expect(availableSeats.value).toEqual(['CA', 'FO'])
    })

    it('cascades bases from selected fleet and seat', () => {
      mockStore.entries = [
        makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
        makeEntry({ fleet: '737', seat: 'FO', base: 'LAX' }),
        makeEntry({ fleet: '777', seat: 'CA', base: 'ORD' }),
      ]
      const { availableBases, selectedFleet, selectedSeat } = useQualAnalytics()
      selectedFleet.value = '737'
      selectedSeat.value = 'CA'
      expect(availableBases.value).toEqual(['JFK'])
    })

    it('returns all bases when no filter is selected', () => {
      mockStore.entries = [
        makeEntry({ base: 'JFK' }),
        makeEntry({ base: 'LAX' }),
        makeEntry({ base: 'JFK' }),
      ]
      const { availableBases } = useQualAnalytics()
      expect(availableBases.value).toEqual(['JFK', 'LAX'])
    })

    it('returns empty arrays when no entries', () => {
      const { availableFleets, availableSeats, availableBases } = useQualAnalytics()
      expect(availableFleets.value).toEqual([])
      expect(availableSeats.value).toEqual([])
      expect(availableBases.value).toEqual([])
    })
  })

  describe('qualSpec and qualLabel', () => {
    it('returns empty spec when no filter selected', () => {
      mockStore.entries = [makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' })]
      const { qualSpec } = useQualAnalytics()
      expect(qualSpec.value).toEqual({})
    })

    it('returns spec with fleet and seat when selected', () => {
      mockStore.entries = [makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' })]
      const { qualSpec, selectedFleet, selectedSeat } = useQualAnalytics()
      selectedFleet.value = '737'
      selectedSeat.value = 'CA'
      expect(qualSpec.value).toEqual({ fleet: '737', seat: 'CA' })
    })

    it('returns spec with all three dimensions when selected', () => {
      mockStore.entries = [makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' })]
      const { qualSpec, selectedFleet, selectedSeat, selectedBase } = useQualAnalytics()
      selectedFleet.value = '737'
      selectedSeat.value = 'CA'
      selectedBase.value = 'JFK'
      expect(qualSpec.value).toEqual({ fleet: '737', seat: 'CA', base: 'JFK' })
    })

    it('returns empty string qualLabel for company-wide (no filter)', () => {
      mockStore.entries = [makeEntry()]
      const { qualLabel } = useQualAnalytics()
      expect(qualLabel.value).toBe('')
    })

    it('returns descriptive qualLabel when filters are set', () => {
      mockStore.entries = [makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' })]
      const { qualLabel, selectedFleet, selectedSeat } = useQualAnalytics()
      selectedFleet.value = '737'
      selectedSeat.value = 'CA'
      expect(qualLabel.value).not.toBe('')
      expect(qualLabel.value).toContain('737')
    })
  })

  describe('clearFilter', () => {
    it('resets all filter selections to null', () => {
      mockStore.entries = [makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' })]
      const { selectedFleet, selectedSeat, selectedBase, clearFilter } = useQualAnalytics()
      selectedFleet.value = '737'
      selectedSeat.value = 'CA'
      selectedBase.value = 'JFK'
      clearFilter()
      expect(selectedFleet.value).toBeNull()
      expect(selectedSeat.value).toBeNull()
      expect(selectedBase.value).toBeNull()
    })
  })

  describe('demographics', () => {
    it('returns ageDistribution with buckets and nullCount', () => {
      mockStore.entries = [
        makeEntry({ retire_date: '2030-01-01' }),
        makeEntry({ retire_date: undefined }),
      ]
      mockUserStore.retirementAge = 65
      const { ageDistribution } = useQualAnalytics()
      const result = ageDistribution.value
      expect(result).toHaveProperty('buckets')
      expect(result).toHaveProperty('nullCount')
      expect(Array.isArray(result.buckets)).toBe(true)
      expect(result.buckets.length).toBeGreaterThan(0)
      expect(result.nullCount).toBe(1)
    })

    it('returns mostJuniorCAs per qual', () => {
      mockStore.entries = [
        makeEntry({ seniority_number: 1, seat: 'CA', fleet: '737', base: 'JFK', hire_date: '2005-01-01' }),
        makeEntry({ seniority_number: 5, seat: 'CA', fleet: '737', base: 'JFK', hire_date: '2015-01-01' }),
        makeEntry({ seniority_number: 3, seat: 'CA', fleet: '777', base: 'LAX', hire_date: '2010-01-01' }),
      ]
      const { mostJuniorCAs } = useQualAnalytics()
      expect(mostJuniorCAs.value.length).toBe(2)
    })

    it('returns qualComposition rows', () => {
      mockStore.entries = [
        makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
        makeEntry({ fleet: '737', seat: 'CA', base: 'LAX' }),
        makeEntry({ fleet: '737', seat: 'FO', base: 'JFK' }),
      ]
      const { qualComposition } = useQualAnalytics()
      expect(qualComposition.value.length).toBe(2)
    })

    it('returns yosDistribution with correct shape', () => {
      mockStore.entries = [
        makeEntry({ hire_date: '2005-01-01' }),
        makeEntry({ hire_date: '2010-01-01' }),
      ]
      const { yosDistribution } = useQualAnalytics()
      const result = yosDistribution.value
      expect(result).toHaveProperty('entryFloor')
      expect(result).toHaveProperty('median')
      expect(result).toHaveProperty('max')
    })

    it('returns yosHistogram array', () => {
      mockStore.entries = [makeEntry({ hire_date: '2010-01-01' })]
      const { yosHistogram } = useQualAnalytics()
      expect(Array.isArray(yosHistogram.value)).toBe(true)
      expect(yosHistogram.value.length).toBeGreaterThan(0)
    })
  })

  describe('projections — powerIndexCells', () => {
    it('returns empty array when no user entry (no anchor)', () => {
      mockUserStore.employeeNumber = null
      mockStore.entries = [makeEntry()]
      const { powerIndexCells } = useQualAnalytics()
      expect(powerIndexCells.value).toEqual([])
    })

    it('returns cells when user entry exists', () => {
      mockUserStore.employeeNumber = '500'
      mockStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1, fleet: '737', seat: 'CA', base: 'JFK', retire_date: '2030-01-01' }),
        makeEntry({ employee_number: '500', seniority_number: 5, fleet: '737', seat: 'CA', base: 'JFK', retire_date: '2040-01-01' }),
      ]
      const { powerIndexCells } = useQualAnalytics()
      expect(powerIndexCells.value.length).toBeGreaterThan(0)
      expect(powerIndexCells.value[0]).toHaveProperty('fleet')
      expect(powerIndexCells.value[0]).toHaveProperty('seat')
      expect(powerIndexCells.value[0]).toHaveProperty('base')
      expect(powerIndexCells.value[0]).toHaveProperty('state')
    })
  })

  describe('projections — retirementWave (scoped)', () => {
    it('returns wave buckets with correct shape', () => {
      mockStore.entries = [
        makeEntry({ retire_date: '2026-06-01' }),
        makeEntry({ retire_date: '2027-06-01' }),
        makeEntry({ retire_date: '2030-06-01' }),
      ]
      const { retirementWave } = useQualAnalytics()
      const result = retirementWave.value
      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('year')
        expect(result[0]).toHaveProperty('count')
        expect(result[0]).toHaveProperty('isWave')
      }
    })

    it('filters retirementWave by qualSpec', () => {
      mockUserStore.employeeNumber = '100'
      mockStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1, fleet: '737', retire_date: '2026-06-01' }),
        makeEntry({ employee_number: '200', seniority_number: 2, fleet: '777', retire_date: '2027-06-01' }),
      ]
      const { retirementWave, selectedFleet } = useQualAnalytics()
      selectedFleet.value = '737'
      const result = retirementWave.value
      const total = result.reduce((sum, b) => sum + b.count, 0)
      expect(total).toBe(1)
    })

    it('returns waveTrajectory points when user entry exists', () => {
      mockUserStore.employeeNumber = '500'
      mockStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1, retire_date: '2030-01-01' }),
        makeEntry({ employee_number: '500', seniority_number: 5, retire_date: '2040-01-01' }),
      ]
      const { waveTrajectory } = useQualAnalytics()
      expect(waveTrajectory.value.length).toBeGreaterThan(0)
      expect(waveTrajectory.value[0]).toHaveProperty('date')
      expect(waveTrajectory.value[0]).toHaveProperty('rank')
      expect(waveTrajectory.value[0]).toHaveProperty('percentile')
    })

    it('returns trajectoryDeltas from scoped trajectory', () => {
      mockUserStore.employeeNumber = '500'
      mockStore.entries = [
        makeEntry({ employee_number: '100', seniority_number: 1, retire_date: '2030-01-01' }),
        makeEntry({ employee_number: '500', seniority_number: 5, retire_date: '2040-01-01' }),
      ]
      const { trajectoryDeltas } = useQualAnalytics()
      expect(Array.isArray(trajectoryDeltas.value)).toBe(true)
    })
  })

  describe('projections — thresholdResult', () => {
    it('returns null when no user entry', () => {
      mockUserStore.employeeNumber = null
      const { thresholdResult } = useQualAnalytics()
      expect(thresholdResult.value).toBeNull()
    })

    it('defaults targetPercentile to 50', () => {
      const { targetPercentile } = useQualAnalytics()
      expect(targetPercentile.value).toBe(50)
    })
  })

  describe('banner state', () => {
    it('starts as not dismissed', () => {
      const { isBannerDismissed } = useQualAnalytics()
      expect(isBannerDismissed.value).toBe(false)
    })

    it('dismissBanner persists to localStorage', () => {
      const { isBannerDismissed, dismissBanner } = useQualAnalytics()
      dismissBanner()
      expect(isBannerDismissed.value).toBe(true)
      expect(localStorageMock['qual-projections-banner-dismissed']).toBe('true')
    })
  })

  describe('empty defaults when lens is null', () => {
    it('returns safe defaults for all computed properties', () => {
      mockStore.entries = []
      mockUserStore.employeeNumber = null
      const qa = useQualAnalytics()
      expect(qa.ageDistribution.value).toEqual({ buckets: [], nullCount: 0 })
      expect(qa.mostJuniorCAs.value).toEqual([])
      expect(qa.qualComposition.value).toEqual([])
      expect(qa.yosDistribution.value).toEqual({ entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 })
      expect(qa.yosHistogram.value).toEqual([])
      expect(qa.powerIndexCells.value).toEqual([])
      expect(qa.retirementWave.value).toEqual([])
      expect(qa.waveTrajectory.value).toEqual([])
      expect(qa.thresholdResult.value).toBeNull()
      expect(qa.trajectoryDeltas.value).toEqual([])
    })
  })
})
