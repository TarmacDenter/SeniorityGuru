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

const { useNewHireMode } = await import('./useNewHireMode')

describe('useNewHireMode', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockUserStore.profile = null
    const mode = useNewHireMode()
    mode.enabled.value = false
    mode.selectedBase.value = null
    mode.selectedSeat.value = null
    mode.selectedFleet.value = null
    mode.birthDate.value = null
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

  describe('syntheticEntry', () => {
    it('is null when not active', () => {
      const { syntheticEntry } = useNewHireMode()
      expect(syntheticEntry.value).toBeNull()
    })

    it('is null when enabled but not configured', () => {
      mockUserStore.profile = makeProfile({ employee_number: null })
      const { enabled, syntheticEntry } = useNewHireMode()
      enabled.value = true
      // syntheticEntry is null because isConfigured is false (no base/seat/fleet/birthDate)
      expect(syntheticEntry.value).toBeNull()
    })

    it('creates a synthetic entry with seniority_number = max + 1', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 10, employee_number: '100' }),
        makeEntry({ seniority_number: 50, employee_number: '200' }),
        makeEntry({ seniority_number: 25, employee_number: '300' }),
      ]
      const mode = useNewHireMode()
      mode.enabled.value = true
      mode.selectedBase.value = 'JFK'
      mode.selectedSeat.value = 'CA'
      mode.selectedFleet.value = '737'
      mode.birthDate.value = '1970-06-15'

      expect(mode.syntheticEntry.value).not.toBeNull()
      expect(mode.syntheticEntry.value!.seniority_number).toBe(51)
      expect(mode.syntheticEntry.value!.employee_number).toBe('_new_hire')
      expect(mode.syntheticEntry.value!.name).toBe('You (New Hire)')
    })

    it('uses selected base/seat/fleet', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { enabled, selectedBase, selectedSeat, selectedFleet, birthDate, syntheticEntry } = useNewHireMode()
      enabled.value = true
      selectedBase.value = 'LAX'
      selectedSeat.value = 'FO'
      selectedFleet.value = '777'
      birthDate.value = '1970-06-15'

      expect(syntheticEntry.value!.base).toBe('LAX')
      expect(syntheticEntry.value!.seat).toBe('FO')
      expect(syntheticEntry.value!.fleet).toBe('777')
    })

    it('is null when inputs are not configured', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { enabled, syntheticEntry } = useNewHireMode()
      enabled.value = true

      expect(syntheticEntry.value).toBeNull()
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

    it('excludes falsy values from available options', () => {
      mockSeniorityStore.entries = [
        makeEntry({ base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ base: '' as any, seat: '' as any, fleet: '' as any }),
      ]
      const { availableBases, availableSeats, availableFleets } = useNewHireMode()
      expect(availableBases.value).toEqual(['JFK'])
      expect(availableSeats.value).toEqual(['CA'])
      expect(availableFleets.value).toEqual(['737'])
    })
  })

  describe('retireDate', () => {
    it('defaults to birthDate + 65 years when profile has no retirement age', () => {
      const { birthDate, retireDate } = useNewHireMode()
      birthDate.value = '1990-06-15'
      expect(retireDate.value).toBe('2055-06-15')
    })

    it('uses profile mandatory_retirement_age when set', () => {
      mockUserStore.profile = makeProfile({ mandatory_retirement_age: 60 })
      const { birthDate, retireDate } = useNewHireMode()
      birthDate.value = '1990-06-15'
      expect(retireDate.value).toBe('2050-06-15')
    })

    it('includes computed retireDate in synthetic entry', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { enabled, birthDate, selectedBase, selectedSeat, selectedFleet, syntheticEntry } = useNewHireMode()
      enabled.value = true
      selectedBase.value = 'JFK'
      selectedSeat.value = 'CA'
      selectedFleet.value = '737'
      birthDate.value = '1990-06-15'
      expect(syntheticEntry.value?.retire_date).toBe('2055-06-15')
    })

    it('retire_date is undefined when birthDate is not provided', () => {
      mockUserStore.profile = makeProfile({ employee_number: '999' })
      mockSeniorityStore.entries = [makeEntry({ employee_number: '100' })]
      const { enabled, selectedBase, selectedSeat, selectedFleet, birthDate, syntheticEntry } = useNewHireMode()
      enabled.value = true
      selectedBase.value = 'JFK'
      selectedSeat.value = 'CA'
      selectedFleet.value = '737'
      // birthDate is null → isConfigured is false → syntheticEntry is null
      expect(birthDate.value).toBeNull()
      expect(syntheticEntry.value).toBeNull()
    })

    it('retireDate is null when birthDate is null', () => {
      const { retireDate } = useNewHireMode()
      expect(retireDate.value).toBeNull()
    })
  })
})
