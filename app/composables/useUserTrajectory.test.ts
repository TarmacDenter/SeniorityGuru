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

// Mock useNewHireMode to be inactive by default
vi.mock('./useNewHireMode', () => ({
  useNewHireMode: () => ({
    enabled: { value: false },
    isActive: { value: false },
    syntheticEntry: { value: null },
    realUserFound: { value: false },
    selectedBase: { value: null },
    selectedSeat: { value: null },
    selectedFleet: { value: null },
    availableBases: { value: [] },
    availableSeats: { value: [] },
    availableFleets: { value: [] },
  }),
}))

const { useUserTrajectory } = await import('./useUserTrajectory')

describe('useUserTrajectory', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockUserStore.profile = null
  })

  describe('trajectoryChartData', () => {
    it('returns empty data when no user entry', () => {
      const { trajectoryChartData } = useUserTrajectory()
      expect(trajectoryChartData.value.labels).toEqual([])
      expect(trajectoryChartData.value.data).toEqual([])
    })

    it('returns trajectory data when user entry exists', () => {
      mockUserStore.profile = makeProfile({ employee_number: '500' })
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: '2026-06-01' }),
        makeEntry({ seniority_number: 5, employee_number: '500', retire_date: '2040-01-01' }),
      ]
      const { trajectoryChartData } = useUserTrajectory()
      expect(trajectoryChartData.value.labels.length).toBeGreaterThan(0)
      expect(trajectoryChartData.value.data.length).toBeGreaterThan(0)
      expect(trajectoryChartData.value.data[trajectoryChartData.value.data.length - 1]!).toBeGreaterThanOrEqual(
        trajectoryChartData.value.data[0]!,
      )
    })
  })

  describe('computeRetirementProjection', () => {
    it('returns empty when no lens (no entries, no user)', () => {
      const { computeRetirementProjection } = useUserTrajectory()
      const result = computeRetirementProjection()
      expect(result.labels).toEqual([])
      expect(result.data).toEqual([])
      expect(result.filteredTotal).toBe(0)
    })

    it('returns empty when entries exist but no user entry (no lens)', () => {
      const now = new Date()
      const nextYear = now.getFullYear() + 1
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, employee_number: '100', retire_date: `${nextYear}-03-01` }),
        makeEntry({ seniority_number: 2, employee_number: '200', retire_date: `${nextYear}-09-01` }),
      ]
      const { computeRetirementProjection } = useUserTrajectory()
      const result = computeRetirementProjection()
      expect(result.labels).toEqual([])
      expect(result.data).toEqual([])
      expect(result.filteredTotal).toBe(0)
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
