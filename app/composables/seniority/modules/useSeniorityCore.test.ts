import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeniorityCore } from './useSeniorityCore'

const mockStore = vi.hoisted(() => ({ entries: [] as any[] }))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65 }))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))
vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))
vi.mock('~/utils/db', () => ({
  db: {
    preferences: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue('key'),
    },
  },
}))

const { makeEntry } = await import('~/test-utils/factories')

// Reset module-level singleton state between tests
beforeEach(() => {
  mockStore.entries = []
  mockUserStore.employeeNumber = null
  mockUserStore.retirementAge = 65
  // Reset new-hire module-level singletons via the composable's reset()
  const { newHire } = useSeniorityCore()
  newHire.reset()
})

describe('useSeniorityCore', () => {
  it('returns null snapshot and lens when store entries are empty', () => {
    const { snapshot, lens } = useSeniorityCore()
    expect(snapshot.value).toBeNull()
    expect(lens.value).toBeNull()
  })

  it('creates snapshot when entries exist', () => {
    mockStore.entries = [makeEntry()]
    const { snapshot } = useSeniorityCore()
    expect(snapshot.value).not.toBeNull()
    expect(snapshot.value!.entries).toHaveLength(1)
  })

  it('creates lens anchored to user employee_number when matched', () => {
    mockStore.entries = [makeEntry({ seniority_number: 1, employee_number: 'E1', retire_date: '2045-01-01' })]
    mockUserStore.employeeNumber = 'E1'
    const { lens } = useSeniorityCore()
    expect(lens.value).not.toBeNull()
    expect(lens.value!.anchor).toEqual({
      seniorityNumber: 1,
      retireDate: '2045-01-01',
      employeeNumber: 'E1',
    })
  })

  it('returns null lens when user has no matching entry', () => {
    mockStore.entries = [makeEntry()]
    mockUserStore.employeeNumber = 'UNKNOWN'
    const { lens } = useSeniorityCore()
    expect(lens.value).toBeNull()
  })

  it('hasData/hasAnchor readiness signals are correct', () => {
    mockStore.entries = [makeEntry({ employee_number: 'E1' })]
    mockUserStore.employeeNumber = 'E1'
    const { hasData, hasAnchor } = useSeniorityCore()
    expect(hasData.value).toBe(true)
    expect(hasAnchor.value).toBe(true)
  })

  it('hasData is true but hasAnchor is false when no user match', () => {
    mockStore.entries = [makeEntry()]
    mockUserStore.employeeNumber = 'UNKNOWN'
    const { hasData, hasAnchor } = useSeniorityCore()
    expect(hasData.value).toBe(true)
    expect(hasAnchor.value).toBe(false)
  })

  it('hasData and hasAnchor are both false when no entries', () => {
    const { hasData, hasAnchor } = useSeniorityCore()
    expect(hasData.value).toBe(false)
    expect(hasAnchor.value).toBe(false)
  })

  it('userEntry returns the matched entry', () => {
    const entry = makeEntry({ employee_number: 'E1' })
    mockStore.entries = [entry]
    mockUserStore.employeeNumber = 'E1'
    const { userEntry } = useSeniorityCore()
    expect(userEntry.value).toEqual(entry)
  })

  it('userEntry returns undefined when no match', () => {
    mockStore.entries = [makeEntry()]
    mockUserStore.employeeNumber = 'UNKNOWN'
    const { userEntry } = useSeniorityCore()
    expect(userEntry.value).toBeUndefined()
  })

  it('new-hire mode: syntheticEntry is null when disabled', () => {
    mockStore.entries = [makeEntry()]
    const { newHire } = useSeniorityCore()
    newHire.enabled.value = false
    expect(newHire.syntheticEntry.value).toBeNull()
  })

  it('new-hire mode: creates synthetic entry with seniority_number = max + 1', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 5, employee_number: 'A' }),
      makeEntry({ seniority_number: 10, employee_number: 'B' }),
    ]
    const { newHire } = useSeniorityCore()
    newHire.enabled.value = true
    newHire.selectedBase.value = 'JFK'
    newHire.selectedSeat.value = 'FO'
    newHire.selectedFleet.value = '737'
    newHire.birthDate.value = '1990-06-15'
    expect(newHire.syntheticEntry.value).not.toBeNull()
    expect(newHire.syntheticEntry.value!.seniority_number).toBe(11)
    expect(newHire.syntheticEntry.value!.employee_number).toBe('_new_hire')
    expect(newHire.syntheticEntry.value!.base).toBe('JFK')
    expect(newHire.syntheticEntry.value!.seat).toBe('FO')
    expect(newHire.syntheticEntry.value!.fleet).toBe('737')
  })

  it('new-hire mode: snapshot includes synthetic entry when active', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'A' }),
    ]
    const { snapshot, newHire } = useSeniorityCore()
    newHire.enabled.value = true
    newHire.selectedBase.value = 'JFK'
    newHire.selectedSeat.value = 'FO'
    newHire.selectedFleet.value = '737'
    newHire.birthDate.value = '1990-06-15'
    expect(snapshot.value).not.toBeNull()
    expect(snapshot.value!.entries).toHaveLength(2)
    expect(snapshot.value!.byEmployeeNumber.has('_new_hire')).toBe(true)
  })

  it('new-hire mode: lens re-anchors to synthetic entry when active', () => {
    mockStore.entries = [
      makeEntry({ seniority_number: 1, employee_number: 'A' }),
    ]
    mockUserStore.employeeNumber = 'A'
    const { lens, newHire } = useSeniorityCore()

    // Before new-hire mode: lens anchored to real user
    expect(lens.value).not.toBeNull()
    expect(lens.value!.anchor!.employeeNumber).toBe('A')

    // Enable new-hire mode
    newHire.enabled.value = true
    newHire.selectedBase.value = 'JFK'
    newHire.selectedSeat.value = 'FO'
    newHire.selectedFleet.value = '737'
    newHire.birthDate.value = '1990-06-15'

    // Now: lens re-anchored to synthetic entry
    expect(lens.value).not.toBeNull()
    expect(lens.value!.anchor!.employeeNumber).toBe('_new_hire')
  })

  it('isNewHireMode reflects enabled state', () => {
    const { isNewHireMode, newHire } = useSeniorityCore()
    expect(isNewHireMode.value).toBe(false)
    newHire.enabled.value = true
    expect(isNewHireMode.value).toBe(true)
    newHire.enabled.value = false
    expect(isNewHireMode.value).toBe(false)
  })

  it('entries mirrors store entries', () => {
    const e1 = makeEntry({ employee_number: 'E1', seniority_number: 1 })
    mockStore.entries = [e1]
    const { entries } = useSeniorityCore()
    expect(entries.value).toHaveLength(1)
    expect(entries.value[0]!.employee_number).toBe('E1')
  })
})
