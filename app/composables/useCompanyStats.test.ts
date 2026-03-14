// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SeniorityEntryResponse, SeniorityListResponse } from '../../shared/schemas/seniority-list'

type SeniorityEntry = SeniorityEntryResponse
type SeniorityList = SeniorityListResponse

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

function makeList(overrides: Partial<SeniorityList> = {}): SeniorityList {
  return {
    id: 'list-1',
    airline: 'DAL',
    effective_date: '2026-01-15',
    created_at: '2026-01-15T00:00:00Z',
    status: 'active',
    title: null,
    ...overrides,
  }
}

const mockSeniorityStore = vi.hoisted(() => ({
  entries: [] as SeniorityEntry[],
  lists: [] as SeniorityList[],
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockSeniorityStore,
}))

const { useCompanyStats } = await import('./useCompanyStats')

describe('useCompanyStats', () => {
  beforeEach(() => {
    mockSeniorityStore.entries = []
    mockSeniorityStore.lists = []
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
    it('builds unique qual combos from actual entries', () => {
      mockSeniorityStore.entries = [
        makeEntry({ base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ base: 'LAX', seat: 'FO', fleet: '777' }),
        makeEntry({ base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ base: null, seat: null, fleet: null }),
      ]
      const { quals } = useCompanyStats()
      expect(quals.value).toEqual([
        { seat: 'CA', fleet: '737', base: 'JFK', label: 'CA/737/JFK' },
        { seat: 'FO', fleet: '777', base: 'LAX', label: 'FO/777/LAX' },
      ])
    })

    it('does not generate cross-product combos', () => {
      mockSeniorityStore.entries = [
        makeEntry({ base: 'JFK', seat: 'CA', fleet: '737' }),
        makeEntry({ base: 'LAX', seat: 'FO', fleet: '777' }),
      ]
      const { quals } = useCompanyStats()
      const labels = quals.value.map((q) => q.label)
      expect(labels).not.toContain('CA/777/LAX')
      expect(labels).not.toContain('FO/737/JFK')
      expect(labels).toHaveLength(2)
    })
  })
})
