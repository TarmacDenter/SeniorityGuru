// @vitest-environment node
import { describe, it, expect, vi, beforeEach, ref, computed } from 'vitest'
import type { SeniorityEntryResponse, SeniorityListResponse } from '../../shared/schemas/seniority-list'
import type { Qual, SenioritySnapshot } from '#shared/utils/seniority-engine'
import { makeEntry, makeList } from '#shared/test-utils/factories'

const mockSeniorityStore = vi.hoisted(() => ({
  entries: [] as SeniorityEntryResponse[],
  lists: [] as SeniorityListResponse[],
}))

const mockSnapshot = vi.hoisted(() => ({
  value: null as SenioritySnapshot | null,
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockSeniorityStore,
}))

vi.mock('./useSeniorityEngine', () => ({
  useSeniorityEngine: () => ({ snapshot: mockSnapshot }),
}))

const { useCompanyStats } = await import('./useCompanyStats')

describe('useCompanyStats', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockSeniorityStore.lists = []
    mockSnapshot.value = null
  })

  describe('aggregateStats', () => {
    it('computes correct averages', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 10, fleet: '737', base: 'JFK', retire_date: '2036-01-01' }),
        makeEntry({ seniority_number: 20, fleet: '737', base: 'JFK', retire_date: '2040-01-01' }),
        makeEntry({ seniority_number: 5, fleet: '777', base: 'LAX', retire_date: '2035-01-01' }),
      ]
      const { aggregateStats } = useCompanyStats()
      const agg = aggregateStats.value
      expect(agg.length).toBe(2)
      const group737 = agg.find((a) => a.category === '737 / JFK')
      expect(group737!.totalPilots).toBe(2)
      expect(group737!.avgSeniority).toBe(15)
      const group777 = agg.find((a) => a.category === '777 / LAX')
      expect(group777!.totalPilots).toBe(1)
      expect(group777!.avgSeniority).toBe(5)
    })

    it('skips entries with null fleet or base', () => {
      mockSeniorityStore.entries = [
        makeEntry({ seniority_number: 1, fleet: null, base: 'JFK' }),
        makeEntry({ seniority_number: 2, fleet: '737', base: null }),
        makeEntry({ seniority_number: 3, fleet: '737', base: 'JFK' }),
      ]
      const { aggregateStats } = useCompanyStats()
      expect(aggregateStats.value.length).toBe(1)
      expect(aggregateStats.value[0]!.totalPilots).toBe(1)
    })
  })

  describe('recentLists', () => {
    it('maps lists correctly', () => {
      mockSeniorityStore.lists = [
        makeList({ effective_date: '2026-01-15' }),
        makeList({ id: 'list-2', effective_date: '2025-06-01' }),
      ]
      const { recentLists } = useCompanyStats()
      const lists = recentLists.value
      expect(lists).toHaveLength(2)
      expect(lists[0]!.title).toBe('Jan 2026 Seniority List')
      expect(lists[0]!.description).toBe('Uploaded')
      expect(lists[0]!.icon).toBe('i-lucide-file-text')
      expect(lists[1]!.title).toBe('Jun 2025 Seniority List')
    })
  })

  describe('quals', () => {
    it('returns empty array when snapshot is null', () => {
      mockSnapshot.value = null
      const { quals } = useCompanyStats()
      expect(quals.value).toEqual([])
    })

    it('returns quals from snapshot', () => {
      const snapshotQuals: Qual[] = [
        { seat: 'CA', fleet: '737', base: 'JFK', label: 'CA/737/JFK' },
        { seat: 'FO', fleet: '777', base: 'LAX', label: 'FO/777/LAX' },
      ]
      mockSnapshot.value = { quals: snapshotQuals } as unknown as SenioritySnapshot
      const { quals } = useCompanyStats()
      expect(quals.value).toEqual(snapshotQuals)
    })

    it('returns a copy of snapshot quals (not mutating original)', () => {
      const snapshotQuals: Qual[] = [
        { seat: 'CA', fleet: '737', base: 'JFK', label: 'CA/737/JFK' },
      ]
      mockSnapshot.value = { quals: snapshotQuals } as unknown as SenioritySnapshot
      const { quals } = useCompanyStats()
      const result = quals.value
      expect(result).not.toBe(snapshotQuals)
      expect(result).toEqual(snapshotQuals)
    })
  })
})
