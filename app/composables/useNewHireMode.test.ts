// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SeniorityEntryResponse } from '../../shared/schemas/seniority-list'
import type { ProfileResponse } from '../../shared/schemas/settings'

type SeniorityEntry = SeniorityEntryResponse
type Profile = ProfileResponse

function makeEntry(overrides: Partial<SeniorityEntry> = {}): SeniorityEntry {
  return {
    id: 'entry-1',
    list_id: 'list-1',
    seniority_number: 1,
    employee_number: '100',
    name: 'Test Pilot',
    hire_date: '2010-01-15',
    base: 'JFK',
    seat: 'CA',
    fleet: '737',
    retire_date: '2035-06-15',
    ...overrides,
  }
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    role: 'user',
    icao_code: 'DAL',
    employee_number: '500',
    created_at: '2026-01-01T00:00:00Z',
    mandatory_retirement_age: 65,
    ...overrides,
  }
}

const mockSeniorityStore = vi.hoisted(() => ({
  entries: [] as SeniorityEntry[],
  currentListId: null as string | null,
}))

const mockUserStore = vi.hoisted(() => ({
  profile: null as Profile | null,
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockSeniorityStore,
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

const { useNewHireMode } = await import('./useNewHireMode')

describe('useNewHireMode', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockSeniorityStore.currentListId = null
    mockUserStore.profile = null
  })

  describe('realUserFound', () => {
    it('is false when no profile', () => {
      const { realUserFound } = useNewHireMode()
      expect(realUserFound.value).toBe(false)
    })

    it('is false when employee number not in entries', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { realUserFound } = useNewHireMode()
      expect(realUserFound.value).toBe(false)
    })

    it('is true when employee number matches an entry', () => {
      mockUserStore.profile = makeProfile({ employee_number: '100' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { realUserFound } = useNewHireMode()
      expect(realUserFound.value).toBe(true)
    })
  })

  describe('isActive', () => {
    it('is false when not enabled', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { isActive } = useNewHireMode()
      expect(isActive.value).toBe(false)
    })

    it('is false when enabled but user is found in list', () => {
      mockUserStore.profile = makeProfile({ employee_number: '100' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { enabled, isActive } = useNewHireMode()
      enabled.value = true
      expect(isActive.value).toBe(false)
    })

    it('is true when enabled and user not found in list', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { enabled, isActive } = useNewHireMode()
      enabled.value = true
      expect(isActive.value).toBe(true)
    })
  })

  describe('syntheticEntry', () => {
    it('is null when not active', () => {
      const { syntheticEntry } = useNewHireMode()
      expect(syntheticEntry.value).toBeNull()
    })

    it('is null when active but no employee number', () => {
      mockUserStore.profile = makeProfile({ employee_number: null })
      const { enabled, syntheticEntry } = useNewHireMode()
      enabled.value = true
      expect(syntheticEntry.value).toBeNull()
    })

    it('creates a synthetic entry with seniority_number = max + 1', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 10, employee_number: '100' }),
        makeEntry({ seniority_number: 50, employee_number: '200' }),
        makeEntry({ seniority_number: 25, employee_number: '300' }),
      ]
      mockSeniorityStore.currentListId = 'list-1'
      const { enabled, syntheticEntry } = useNewHireMode()
      enabled.value = true

      expect(syntheticEntry.value).not.toBeNull()
      expect(syntheticEntry.value!.seniority_number).toBe(51)
      expect(syntheticEntry.value!.employee_number).toBe('999')
      expect(syntheticEntry.value!.id).toBe('synthetic-new-hire')
      expect(syntheticEntry.value!.list_id).toBe('list-1')
      expect(syntheticEntry.value!.name).toBe('You (New Hire)')
    })

    it('uses selected base/seat/fleet', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { enabled, selectedBase, selectedSeat, selectedFleet, syntheticEntry } = useNewHireMode()
      enabled.value = true
      selectedBase.value = 'LAX'
      selectedSeat.value = 'FO'
      selectedFleet.value = '777'

      expect(syntheticEntry.value!.base).toBe('LAX')
      expect(syntheticEntry.value!.seat).toBe('FO')
      expect(syntheticEntry.value!.fleet).toBe('777')
    })

    it('has null base/seat/fleet when none selected', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { enabled, syntheticEntry } = useNewHireMode()
      enabled.value = true

      expect(syntheticEntry.value!.base).toBeNull()
      expect(syntheticEntry.value!.seat).toBeNull()
      expect(syntheticEntry.value!.fleet).toBeNull()
    })
  })

  describe('available options', () => {
    it('computes unique sorted bases from entries', () => {
      mockSeniorityStore.entries = [
        makeEntry({ base: 'LAX' }),
        makeEntry({ base: 'JFK' }),
        makeEntry({ base: 'LAX' }),
        makeEntry({ base: 'ATL' }),
      ]
      const { availableBases } = useNewHireMode()
      expect(availableBases.value).toEqual(['ATL', 'JFK', 'LAX'])
    })

    it('computes unique sorted seats from entries', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seat: 'FO' }),
        makeEntry({ seat: 'CA' }),
        makeEntry({ seat: 'FO' }),
      ]
      const { availableSeats } = useNewHireMode()
      expect(availableSeats.value).toEqual(['CA', 'FO'])
    })

    it('computes unique sorted fleets from entries', () => {
      mockSeniorityStore.entries = [
        makeEntry({ fleet: '777' }),
        makeEntry({ fleet: '737' }),
        makeEntry({ fleet: '777' }),
        makeEntry({ fleet: 'A320' }),
      ]
      const { availableFleets } = useNewHireMode()
      expect(availableFleets.value).toEqual(['737', '777', 'A320'])
    })

    it('excludes null values from available options', () => {
      mockSeniorityStore.entries = [
        makeEntry({ base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ base: null, seat: null, fleet: null }),
      ]
      const { availableBases, availableSeats, availableFleets } = useNewHireMode()
      expect(availableBases.value).toEqual(['JFK'])
      expect(availableSeats.value).toEqual(['CA'])
      expect(availableFleets.value).toEqual(['737'])
    })
  })
})
