// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Tables } from '../../shared/types/database'

type SeniorityEntry = Tables<'seniority_entries'>
type Profile = Tables<'profiles'>

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

const { useUserTrajectory } = await import('./useUserTrajectory')

describe('useUserTrajectory', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockUserStore.profile = null
  })

  describe('trajectoryData', () => {
    it('returns empty data when no user entry', () => {
      const { trajectoryData } = useUserTrajectory()
      expect(trajectoryData.value.labels).toEqual([])
      expect(trajectoryData.value.data).toEqual([])
    })

    it('returns trajectory data when user entry exists', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: '2026-06-01' }),
        makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
      ]
      const { trajectoryData } = useUserTrajectory()
      expect(trajectoryData.value.labels.length).toBeGreaterThan(0)
      expect(trajectoryData.value.data.length).toBeGreaterThan(0)
      expect(trajectoryData.value.data[trajectoryData.value.data.length - 1]!).toBeGreaterThanOrEqual(
        trajectoryData.value.data[0]!,
      )
    })
  })

  describe('computeRetirementProjection', () => {
    it('returns time buckets with zeros when no entries', () => {
      const { computeRetirementProjection } = useUserTrajectory()
      const result = computeRetirementProjection()
      expect(result.labels.length).toBeGreaterThan(0)
      expect(result.data.every(n => n === 0)).toBe(true)
      expect(result.filteredTotal).toBe(0)
    })

    it('returns company-wide data when no user entry but entries exist', () => {
      const now = new Date()
      const nextYear = now.getFullYear() + 1
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: `${nextYear}-03-01` }),
        makeEntry({ seniority_number: 2, employee_number: '200', retire_date: `${nextYear}-09-01` }),
      ]
      const { computeRetirementProjection } = useUserTrajectory()
      const result = computeRetirementProjection()
      expect(result.filteredTotal).toBe(2)
      expect(result.data.reduce((s, n) => s + n, 0)).toBe(2)
    })

    it('buckets retirements into yearly intervals', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      const now = new Date()
      const year1 = now.getFullYear() + 1
      const year2 = now.getFullYear() + 2
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: `${year1}-03-15` }),
        makeEntry({ seniority_number: 2, employee_number: '200', retire_date: `${year1}-09-15` }),
        makeEntry({ seniority_number: 3, employee_number: '300', retire_date: `${year2}-06-01` }),
        makeEntry({ seniority_number: 5, employee_number: '500', retire_date: `${now.getFullYear() + 4}-01-01` }),
      ]
      const { computeRetirementProjection } = useUserTrajectory()
      const result = computeRetirementProjection()
      expect(result.labels.length).toBeGreaterThan(0)
      expect(result.filteredTotal).toBe(4)
      expect(result.data.reduce((s, n) => s + n, 0)).toBeGreaterThanOrEqual(3)
    })

    it('respects filterFn', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      const now = new Date()
      const nextYear = now.getFullYear() + 1
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', base: 'JFK', retire_date: `${nextYear}-06-01` }),
        makeEntry({ seniority_number: 2, employee_number: '200', base: 'LAX', retire_date: `${nextYear}-06-01` }),
        makeEntry({ seniority_number: 5, employee_number: '500', base: 'JFK', retire_date: `${now.getFullYear() + 5}-01-01` }),
      ]
      const { computeRetirementProjection } = useUserTrajectory()
      const all = computeRetirementProjection()
      const jfk = computeRetirementProjection((e) => e.base === 'JFK')
      expect(all.filteredTotal).toBe(3)
      expect(jfk.filteredTotal).toBe(2)
      expect(jfk.data.reduce((s, n) => s + n, 0)).toBeLessThanOrEqual(all.data.reduce((s, n) => s + n, 0))
    })
  })

  describe('computeComparativeTrajectory', () => {
    it('returns empty when no user entry', () => {
      const { computeComparativeTrajectory } = useUserTrajectory()
      const result = computeComparativeTrajectory(() => true, () => true)
      expect(result).toEqual({ labels: [], currentData: [], compareData: [] })
    })

    it('computes separate trajectories for two filters', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      const now = new Date()
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${now.getFullYear() + 1}-01-01` }),
        makeEntry({ seniority_number: 2, employee_number: '200', seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${now.getFullYear() + 2}-01-01` }),
        makeEntry({ seniority_number: 3, employee_number: '300', seat: 'FO', base: 'LAX', fleet: '777', retire_date: `${now.getFullYear() + 20}-01-01` }),
        makeEntry({ seniority_number: 4, employee_number: '400', seat: 'FO', base: 'LAX', fleet: '777', retire_date: `${now.getFullYear() + 25}-01-01` }),
        makeEntry({ seniority_number: 5, employee_number: '500', seat: 'CA', base: 'JFK', fleet: '737', retire_date: `${now.getFullYear() + 10}-01-01` }),
      ]
      const { computeComparativeTrajectory } = useUserTrajectory()
      const result = computeComparativeTrajectory(
        (e) => e.seat === 'CA' && e.base === 'JFK',
        (e) => e.seat === 'FO' && e.base === 'LAX',
      )
      expect(result.labels.length).toBeGreaterThan(0)
      expect(result.currentData[result.currentData.length - 1]!).toBeGreaterThan(
        result.compareData[result.compareData.length - 1]!,
      )
    })
  })
})
