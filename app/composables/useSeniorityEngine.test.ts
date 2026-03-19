import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useSeniorityEngine } from './useSeniorityEngine'

// Mock stores and composables
const mockStore = vi.hoisted(() => ({ entries: [] as any[] }))
const mockUserEntryRef = vi.hoisted(() => ({ value: undefined as any }))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))
vi.mock('~/stores/user', () => ({
  useUserStore: () => ({}),
}))
vi.mock('./useUserEntry', () => ({
  useUserEntry: () => ref(mockUserEntryRef.value),
}))

const { makeEntry } = await import('#shared/test-utils/factories')

describe('useSeniorityEngine', () => {
  it('returns null snapshot and lens when entries are empty', () => {
    mockStore.entries = []
    mockUserEntryRef.value = undefined
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

  it('creates lens when both entries and user entry are available', () => {
    mockStore.entries = [makeEntry({ seniority_number: 1, employee_number: 'E1' })]
    mockUserEntryRef.value = makeEntry({ seniority_number: 1, employee_number: 'E1', retire_date: '2045-01-01' })
    const { lens } = useSeniorityEngine()
    expect(lens.value).not.toBeNull()
    expect(lens.value!.anchor).toEqual({
      seniorityNumber: 1,
      retireDate: '2045-01-01',
      employeeNumber: 'E1',
    })
  })

  it('returns null lens when user entry is missing', () => {
    mockStore.entries = [makeEntry()]
    mockUserEntryRef.value = undefined
    const { lens } = useSeniorityEngine()
    expect(lens.value).toBeNull()
  })
})
