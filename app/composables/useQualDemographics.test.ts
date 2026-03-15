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

const { useQualDemographics } = await import('./useQualDemographics')

describe('useQualDemographics', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockUserStore.profile = null
  })

  describe('availableFleets', () => {
    it('returns empty array when no entries', () => {
      const { availableFleets } = useQualDemographics()
      expect(availableFleets.value).toEqual([])
    })

    it('returns sorted unique non-null fleets', () => {
      mockSeniorityStore.entries = [
        makeEntry({ fleet: '777' }),
        makeEntry({ fleet: '737' }),
        makeEntry({ fleet: '737' }), // duplicate
        makeEntry({ fleet: null }),  // null excluded
      ]
      const { availableFleets } = useQualDemographics()
      expect(availableFleets.value).toEqual(['737', '777'])
    })
  })

  describe('availableSeats', () => {
    it('returns sorted unique non-null seats', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seat: 'CA' }),
        makeEntry({ seat: 'FO' }),
        makeEntry({ seat: 'CA' }), // duplicate
        makeEntry({ seat: null }), // null excluded
      ]
      const { availableSeats } = useQualDemographics()
      expect(availableSeats.value).toEqual(['CA', 'FO'])
    })
  })

  describe('availableBases', () => {
    it('filters by selectedFleet and selectedSeat when set', () => {
      mockSeniorityStore.entries = [
        makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
        makeEntry({ fleet: '737', seat: 'FO', base: 'LAX' }),
        makeEntry({ fleet: '777', seat: 'CA', base: 'ORD' }),
      ]
      const { availableBases, selectedFleet, selectedSeat } = useQualDemographics()
      selectedFleet.value = '737'
      selectedSeat.value = 'CA'
      // Only entries with fleet=737 AND seat=CA should contribute bases
      expect(availableBases.value).toEqual(['JFK'])
    })

    it('returns all bases when no filter selected', () => {
      mockSeniorityStore.entries = [
        makeEntry({ base: 'JFK' }),
        makeEntry({ base: 'LAX' }),
        makeEntry({ base: null }), // null excluded
      ]
      const { availableBases } = useQualDemographics()
      expect(availableBases.value).toEqual(['JFK', 'LAX'])
    })
  })

  describe('ageDistribution', () => {
    it('returns correct shape with buckets and nullCount', () => {
      mockSeniorityStore.entries = [
        makeEntry({ retire_date: '2030-01-01' }),
        makeEntry({ retire_date: null }),
      ]
      mockUserStore.profile = makeProfile({ mandatory_retirement_age: 65 })
      const { ageDistribution } = useQualDemographics()
      const result = ageDistribution.value
      expect(result).toHaveProperty('buckets')
      expect(result).toHaveProperty('nullCount')
      expect(Array.isArray(result.buckets)).toBe(true)
      expect(result.buckets.length).toBeGreaterThan(0)
      expect(result.nullCount).toBe(1)
    })

    it('uses mandatory_retirement_age from profile (default 65)', () => {
      mockSeniorityStore.entries = [makeEntry({ retire_date: '2026-01-01' })]
      mockUserStore.profile = null
      const { ageDistribution } = useQualDemographics()
      // Just verifies it doesn't throw
      expect(ageDistribution.value.buckets.length).toBeGreaterThan(0)
    })
  })

  describe('mostJuniorCAs', () => {
    it('returns empty array when no CA entries', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seat: 'FO', fleet: '737' }),
      ]
      const { mostJuniorCAs } = useQualDemographics()
      expect(mostJuniorCAs.value).toEqual([])
    })

    it('returns most junior CA per qual (fleet+seat+base)', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, seat: 'CA', fleet: '737', base: 'JFK', hire_date: '2005-01-01' }),
        makeEntry({ seniority_number: 5, seat: 'CA', fleet: '737', base: 'JFK', hire_date: '2015-01-01' }), // most junior 737 CA JFK
        makeEntry({ seniority_number: 3, seat: 'CA', fleet: '777', base: 'LAX', hire_date: '2010-01-01' }),
      ]
      const { mostJuniorCAs } = useQualDemographics()
      const result = mostJuniorCAs.value
      expect(result.length).toBe(2)
      const f737 = result.find((r) => r.fleet === '737')
      expect(f737?.seniorityNumber).toBe(5)
      expect(f737?.qualKey).toBe('737 CA JFK')
    })

    it('filters by selectedFleet when set', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 5, seat: 'CA', fleet: '737', base: 'JFK' }),
        makeEntry({ seniority_number: 3, seat: 'CA', fleet: '777', base: 'JFK' }),
      ]
      const { mostJuniorCAs, selectedFleet } = useQualDemographics()
      selectedFleet.value = '737'
      expect(mostJuniorCAs.value.length).toBe(1)
      expect(mostJuniorCAs.value[0]?.fleet).toBe('737')
    })
  })

  describe('userEntry', () => {
    it('returns undefined when no profile', () => {
      mockSeniorityStore.entries = [makeEntry()]
      mockUserStore.profile = null
      const { userEntry } = useQualDemographics()
      expect(userEntry.value).toBeUndefined()
    })

    it('returns matching entry by employee_number', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [
        makeEntry({ employee_number: '100' }),
        makeEntry({ employee_number: '999', seniority_number: 10 }),
      ]
      const { userEntry } = useQualDemographics()
      expect(userEntry.value?.seniority_number).toBe(10)
    })
  })

  describe('qualComposition', () => {
    it('returns correct qual rows', () => {
      mockSeniorityStore.entries = [
        makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
        makeEntry({ fleet: '737', seat: 'CA', base: 'LAX' }),
        makeEntry({ fleet: '737', seat: 'FO', base: 'JFK' }),
      ]
      const { qualComposition } = useQualDemographics()
      const result = qualComposition.value
      expect(result.length).toBe(2)
      const ca737 = result.find((r) => r.qualKey === '737 CA')
      expect(ca737?.total).toBe(2)
      expect(ca737?.caCount).toBe(2)
      expect(ca737?.foCount).toBe(0)
    })
  })

  describe('yosDistribution', () => {
    it('returns zero distribution when no entries', () => {
      const { yosDistribution } = useQualDemographics()
      expect(yosDistribution.value).toEqual({ entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 })
    })

    it('returns correct shape with real entries', () => {
      mockSeniorityStore.entries = [
        makeEntry({ hire_date: '2005-01-01' }),
        makeEntry({ hire_date: '2010-01-01' }),
        makeEntry({ hire_date: '2015-01-01' }),
      ]
      const { yosDistribution } = useQualDemographics()
      const result = yosDistribution.value
      expect(result).toHaveProperty('entryFloor')
      expect(result).toHaveProperty('p10')
      expect(result).toHaveProperty('p25')
      expect(result).toHaveProperty('median')
      expect(result).toHaveProperty('p75')
      expect(result).toHaveProperty('p90')
      expect(result).toHaveProperty('max')
      expect(result.max).toBeGreaterThan(result.entryFloor)
    })
  })

  describe('yosHistogram', () => {
    it('returns an array of buckets', () => {
      mockSeniorityStore.entries = [makeEntry({ hire_date: '2010-01-01' })]
      const { yosHistogram } = useQualDemographics()
      expect(Array.isArray(yosHistogram.value)).toBe(true)
      expect(yosHistogram.value.length).toBeGreaterThan(0)
      expect(yosHistogram.value[0]).toHaveProperty('label')
      expect(yosHistogram.value[0]).toHaveProperty('count')
    })
  })

  describe('qualFilterFn', () => {
    it('passes all entries when no filter selected', () => {
      mockSeniorityStore.entries = [
        makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
        makeEntry({ fleet: '777', seat: 'FO', base: 'LAX' }),
      ]
      const { qualFilterFn } = useQualDemographics()
      const filtered = mockSeniorityStore.entries.filter(qualFilterFn.value)
      expect(filtered.length).toBe(2)
    })

    it('filters correctly when fleet and seat selected', () => {
      mockSeniorityStore.entries = [
        makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
        makeEntry({ fleet: '777', seat: 'FO', base: 'LAX' }),
      ]
      const { qualFilterFn, selectedFleet, selectedSeat } = useQualDemographics()
      selectedFleet.value = '737'
      selectedSeat.value = 'CA'
      const filtered = mockSeniorityStore.entries.filter(qualFilterFn.value)
      expect(filtered.length).toBe(1)
      expect(filtered[0]?.fleet).toBe('737')
    })
  })
})
