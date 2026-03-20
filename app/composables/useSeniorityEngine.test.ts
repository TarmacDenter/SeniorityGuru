import { describe, it, expect, vi } from 'vitest'
import { useSeniorityEngine } from './useSeniorityEngine'

const mockStore = vi.hoisted(() => ({ entries: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ profile: null as any }))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))
vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

const { makeEntry } = await import('#shared/test-utils/factories')

describe('useSeniorityEngine', () => {
  it('returns null snapshot and lens when entries are empty', () => {
    mockStore.entries = []
    mockUserStore.profile = null
    const { snapshot, lens } = useSeniorityEngine()
    expect(snapshot.value).toBeNull()
    expect(lens.value).toBeNull()
  })

  it('creates snapshot when entries are available', () => {
    mockStore.entries = [makeEntry()]
    const { snapshot } = useSeniorityEngine()
    expect(snapshot.value).not.toBeNull()
    expect(snapshot.value!.entries).toHaveLength(1)
  })

  it('creates lens when user profile matches an entry', () => {
    mockStore.entries = [makeEntry({ seniority_number: 1, employee_number: 'E1', retire_date: '2045-01-01' })]
    mockUserStore.profile = { employee_number: 'E1' }
    const { lens } = useSeniorityEngine()
    expect(lens.value).not.toBeNull()
    expect(lens.value!.anchor).toEqual({
      seniorityNumber: 1,
      retireDate: '2045-01-01',
      employeeNumber: 'E1',
    })
  })

  it('returns null lens when user profile has no matching entry', () => {
    mockStore.entries = [makeEntry()]
    mockUserStore.profile = { employee_number: 'UNKNOWN' }
    const { lens } = useSeniorityEngine()
    expect(lens.value).toBeNull()
  })

  it('returns null lens when user has no employee number', () => {
    mockStore.entries = [makeEntry()]
    mockUserStore.profile = { employee_number: null }
    const { lens } = useSeniorityEngine()
    expect(lens.value).toBeNull()
  })
})
