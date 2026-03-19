import { describe, it, expect, vi } from 'vitest'
import { useEffectiveSeniorityEngine } from './useEffectiveSeniorityEngine'

const mockStore = vi.hoisted(() => ({ entries: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ profile: null as any }))
const mockNewHireMode = vi.hoisted(() => ({
  syntheticEntry: { value: null as any },
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))
vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))
vi.mock('./useNewHireMode', () => ({
  useNewHireMode: () => mockNewHireMode,
}))

const { makeEntry, makeDomainEntry } = await import('#shared/test-utils/factories')

describe('useEffectiveSeniorityEngine', () => {
  it('delegates to base engine when new hire mode is inactive', () => {
    mockStore.entries = [makeEntry({ seniority_number: 1, employee_number: 'E1' })]
    mockUserStore.profile = { employee_number: 'E1' }
    mockNewHireMode.syntheticEntry.value = null

    const { snapshot, lens } = useEffectiveSeniorityEngine()
    expect(snapshot.value).not.toBeNull()
    expect(snapshot.value!.entries).toHaveLength(1)
    expect(lens.value).not.toBeNull()
    expect(lens.value!.anchor!.employeeNumber).toBe('E1')
  })

  it('injects synthetic entry when new hire mode is active', () => {
    mockStore.entries = [makeEntry({ seniority_number: 1, employee_number: 'E1' })]
    mockUserStore.profile = null
    mockNewHireMode.syntheticEntry.value = makeDomainEntry({
      seniority_number: 2,
      employee_number: '_new_hire',
      name: 'You (New Hire)',
      base: 'JFK',
      seat: 'FO',
      fleet: '737',
      retire_date: '2091-06-15',
    })

    const { snapshot, lens } = useEffectiveSeniorityEngine()
    expect(snapshot.value).not.toBeNull()
    expect(snapshot.value!.entries).toHaveLength(2)
    expect(snapshot.value!.byEmployeeNumber.get('_new_hire')).toBeDefined()
    expect(lens.value).not.toBeNull()
    expect(lens.value!.anchor!.employeeNumber).toBe('_new_hire')
  })

  it('falls back to base lens when synthetic entry not configured', () => {
    mockStore.entries = [makeEntry({ seniority_number: 1, employee_number: 'E1' })]
    mockUserStore.profile = { employee_number: 'E1' }
    mockNewHireMode.syntheticEntry.value = null // not configured yet

    const { snapshot, lens } = useEffectiveSeniorityEngine()
    expect(snapshot.value!.entries).toHaveLength(1)
    expect(lens.value).not.toBeNull()
    expect(lens.value!.anchor!.employeeNumber).toBe('E1')
  })

  it('returns null snapshot when no entries exist even in new hire mode', () => {
    mockStore.entries = []
    mockNewHireMode.syntheticEntry.value = makeDomainEntry({ employee_number: '_new_hire' })

    const { snapshot } = useEffectiveSeniorityEngine()
    expect(snapshot.value).toBeNull()
  })
})
